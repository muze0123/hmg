package com.metritag.hmg;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.*;
import java.util.*;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import static com.metritag.hmg.TaskTree.*;

@Service
public class TaskService {
 private final TaskRepository repository;
 private final ObjectMapper json;
 private final JdbcTemplate jdbc;
 private final Environment environment;
 private final TemplateService templates;
 private final TemplateValidator validator;
 public TaskService(TaskRepository repository, ObjectMapper json, JdbcTemplate jdbc, Environment environment, TemplateService templates, TemplateValidator validator) {
  this.repository = repository; this.json = json; this.jdbc = jdbc; this.environment = environment; this.templates=templates; this.validator=validator;
 }
 public record Create(@NotBlank @Size(max=200) String name, @Size(max=100) String vehicleId,
   @NotBlank @Size(max=100) String workflowVersion, @NotEmpty List<@NotBlank String> reviewers) {}
 public record Configure(@NotNull @Min(0) Long version, @NotEmpty List<@NotNull @jakarta.validation.Valid Child> children,
   String vehicleId, String workflowInstanceId, String workflowRevision) {}
 public record Child(@NotNull Kind kind, String regulationId, String templateVersionId,
   @NotBlank String executor, @NotEmpty List<@NotBlank String> reviewers) {}
 public record Command(@NotNull @Min(0) Long version, Map<String, Object> values, String comment,
   boolean workflowDriven) {}
 public record View(String id, long version, TaskTree task) {}
 public java.util.List<View> list(Actor actor) { return repository.findByTenantIdOrderByIdAsc(actor.tenant()).stream().map(this::view).toList(); }
 public View get(String id, Actor actor) { return view(load(id, actor)); }
 private TaskAggregate load(String id, Actor actor) {
  return repository.findByIdAndTenantId(id, actor.tenant())
   .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
 }
 private TaskTree tree(TaskAggregate aggregate) {
  try { return json.readValue(aggregate.payload, TaskTree.class); }
  catch (JsonProcessingException e) { throw new IllegalStateException(e); }
 }
 private View view(TaskAggregate aggregate) { return new View(aggregate.id, aggregate.version, tree(aggregate)); }
 private String encode(Object value) {
  try { return json.writeValueAsString(value); }
  catch (JsonProcessingException e) { throw new IllegalStateException(e); }
 }
 private void platformReady() {
  if (!environment.matchesProfiles("dev")) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
   "Platform identity and workflow adapters are not connected");
 }
 private String hash(Object value) {
  try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(encode(value).getBytes(StandardCharsets.UTF_8))); }
  catch (java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
 }
 @Transactional
 public View create(Create input, String key, Actor actor) {
  platformReady();
  require(key != null && !key.isBlank() && key.length() <= 100, "Idempotency-Key is required (max 100)");
  var existing = repository.findByTenantIdAndRequestKey(actor.tenant(), key);
  if (existing.isPresent()) {
   require(existing.get().requestHash.equals(hash(input)), "Idempotency key was used with different content");
   return view(existing.get());
  }
  TaskTree tree = new TaskTree(); tree.id = UUID.randomUUID().toString(); tree.name = input.name();
  tree.vehicleId = input.vehicleId(); tree.workflowVersion = input.workflowVersion();
  tree.root = new Node(); tree.root.id = tree.id; tree.root.level = Level.MAIN; tree.root.executor = actor.user();
  tree.root.reviewers = new ArrayList<>(input.reviewers());
  tree.record(tree.root, "CREATE", actor.user(), "");
  TaskAggregate row = new TaskAggregate(); row.id = tree.id; row.tenantId = actor.tenant(); row.requestKey = key;
  row.requestHash = hash(input); row.payload = encode(tree); repository.saveAndFlush(row); return view(row);
 }
 private Node editable(TaskTree tree, String id, Actor actor) {
  Node node = tree.node(id); require(node != null, "Node not found");
  require(node.executor.equals(actor.user()), "Only the assigned executor may modify configuration");
  return node;
 }
 private TaskAggregate versioned(String id, long version, Actor actor) {
  TaskAggregate row = load(id, actor); require(row.version == version, "Stale task version"); return row;
 }
 private View save(TaskAggregate row, TaskTree tree) {
  row.payload = encode(tree); repository.saveAndFlush(row); return view(row);
 }
 @Transactional
 public View configure(String id, String nodeId, Configure input, Actor actor) {
  platformReady();
  var row = versioned(id, input.version(), actor); var tree = tree(row); var node = editable(tree, nodeId, actor);
  tree.requireAvailable(node);
  require(node.state == State.PENDING || node.level == Level.MAIN && node.state == State.WITHDRAWN, "Configuration is immutable once execution starts");
  require(node.level != Level.SUBTASK, "Subtasks do not have children");
  boolean sameVehicle = input.vehicleId() == null || java.util.Objects.equals(input.vehicleId(), tree.vehicleId);
  if (node.level == Level.MAIN) {
   if (input.vehicleId() != null) tree.vehicleId = input.vehicleId();
   require(tree.vehicleId != null && !tree.vehicleId.isBlank(), "Vehicle is required");
   if (input.workflowInstanceId() != null && !input.workflowInstanceId().isBlank())
    node.workflowInstanceId = input.workflowInstanceId();
   if (input.workflowRevision() != null && !input.workflowRevision().isBlank())
    node.workflowRevision = input.workflowRevision();
  }
  Set<String> uniqueness = new HashSet<>();
  List<Node> children = new ArrayList<>();
  for (Child config : input.children()) {
   if (node.level == Level.MAIN) {
    require(uniqueness.add(config.kind().name()), "Duplicate section kind");
    if (config.kind() == Kind.VEHICLE) require(config.templateVersionId() != null && !config.templateVersionId().isBlank(), "Vehicle template version is required");
   } else {
    require(config.kind() == node.kind, "Child kind must match section");
    if (node.kind != Kind.VEHICLE) require(config.regulationId() != null && !config.regulationId().isBlank(), "Regulation is required");
    require(config.templateVersionId() != null && !config.templateVersionId().isBlank(), "Template version is required");
    if (node.kind == Kind.VEHICLE) require(config.templateVersionId().equals(node.templateVersionId), "Vehicle template version is fixed by main task");
    require(uniqueness.add(config.regulationId() + "/" + config.templateVersionId()), "Duplicate regulation/template pair");
   }
   Node child = new Node(); child.level = node.level == Level.MAIN ? Level.SECTION : Level.SUBTASK;
   child.kind = config.kind(); child.regulationId = config.regulationId(); child.templateVersionId = config.templateVersionId();
   child.executor = config.executor(); child.reviewers = new ArrayList<>(config.reviewers());
   child.state = child.level == Level.SECTION ? State.PENDING : State.ACTIVE;
   if (child.level == Level.SUBTASK || child.kind == Kind.VEHICLE) child.templateSnapshot=templates.bind(child.templateVersionId,child.kind,child.regulationId,actor);
   // Reuse only exactly matching bindings. Changed assignments/templates create new work;
   // approved values and workflow instances must not leak into a new configuration.
   Node retained = node.children.stream().filter(old -> sameVehicle && old.kind == child.kind
    && java.util.Objects.equals(old.regulationId, child.regulationId)
    && java.util.Objects.equals(old.templateVersionId, child.templateVersionId)
    && java.util.Objects.equals(old.executor, child.executor) && old.reviewers.equals(child.reviewers))
    .findFirst().orElse(null);
   children.add(retained != null ? retained : child);
  }
  node.children = children; node.state = State.ACTIVE;
  if (node.level == Level.MAIN) tree.descendantsPaused = false;
  tree.record(node, "CONFIGURE", actor.user(), ""); return save(row, tree);
 }
 @Transactional
 public View command(String id, String nodeId, String action, Command input, Actor actor) {
  platformReady();
  var row = versioned(id, input.version(), actor); var tree = tree(row); Node node = tree.node(nodeId);
  require(node != null, "Node not found");
  tree.requireAvailable(node);
  switch (action) {
   case "save" -> {
    require(node.level == Level.SUBTASK && node.executor.equals(actor.user()), "Only the subtask executor may fill values");
    require(node.state == State.ACTIVE || node.state == State.REJECTED, "Approved or submitted content is locked");
    require(input.values() != null, "Values are required");
    require(node.templateSnapshot != null,"Task template snapshot is missing");
    validator.validate(node.templateSnapshot,input.values(),false); node.valuesJson = encode(input.values());
    tree.record(node, "SAVE", actor.user(), "");
   }
   case "submitDraft" -> tree.submitDraft(node, actor.user());
   case "submit" -> {
    if (node.level == Level.SUBTASK) {
     require(node.templateSnapshot != null,"Task template snapshot is missing");
     try { validator.validate(node.templateSnapshot,json.readValue(node.valuesJson,new com.fasterxml.jackson.core.type.TypeReference<Map<String,Object>>() {}),true); }
     catch (JsonProcessingException e) { throw new IllegalStateException(e); }
    }
    tree.submit(node, actor.user());
   }
   case "withdraw" -> tree.withdraw(node, actor.user());
   case "void" -> tree.voidTask(node, actor.user());
   case "approve" -> {
    if (input.workflowDriven()) {
     // Platform-bound nodes require a callback; local approval cannot advance them.
     require(node.workflowInstanceId == null, "Workflow-bound nodes advance only through platform callbacks");
    }
    tree.review(node, actor.user(), true, input.comment());
   }
   case "reject" -> tree.review(node, actor.user(), false, input.comment());
   default -> throw new BusinessException("Unsupported action");
  }
  View result = save(row, tree);
  if (tree.root.state == State.COMPLETED) {
   jdbc.update("INSERT INTO outbox_event (id,tenant_id,aggregate_id,event_type,payload,created_at) VALUES (?,?,?,?,?,?)",
    UUID.randomUUID().toString(), actor.tenant(), id, "hmg.task.completed.v1", encode(result), java.time.OffsetDateTime.now());
  }
  return result;
 }
}
