package com.metritag.hmg;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Inbound platform integration: task dispatch and workflow approval callbacks.
 * Every inbound event is deduplicated by (tenant, eventId). Tenant is taken from the
 * authenticated identity — the request body cannot override it. Stale or out-of-order
 * approval callbacks are acknowledged but never mutate task state.
 */
@Service
public class PlatformService {
 private final TaskRepository tasks;
 private final PlatformEventRepository events;
 private final ObjectMapper json;

 public record Dispatch(@NotBlank @Size(max=200) String eventId,
                        @NotBlank @Size(max=200) String sourceTaskId,
                        String sourceRevision,
                        @NotBlank @Size(max=100) String tenantId,
                        @NotBlank @Size(max=200) String name,
                        @NotBlank @Size(max=100) String workflowDefinitionVersion,
                        @NotBlank @Size(max=100) String ownerId) {}
 public record ApprovalCallback(@NotBlank @Size(max=200) String eventId,
                                @NotBlank @Size(max=200) String instanceId,
                                @NotBlank @Size(max=200) String approvalId,
                                @NotBlank @Size(max=200) String businessId,
                                @NotBlank @Size(max=100) String tenantId,
                                @NotBlank @Size(max=100) String actorId,
                                @NotBlank @Size(max=20) String decision,
                                @NotBlank @Size(max=100) String workflowRevision,
                                @NotBlank @Size(max=40) String occurredAt) {}
 public record Acknowledgement(String eventId, String status, String businessId) {}

 public PlatformService(TaskRepository tasks, PlatformEventRepository events, ObjectMapper json) {
  this.tasks = tasks; this.events = events; this.json = json;
 }

 @Transactional
 public Acknowledgement dispatch(Dispatch input, Actor actor) {
  requireTenant(input.tenantId(), actor);
  String key = "dispatch:" + input.eventId();
  String hash = hash(input);
  var prior = events.findByIdAndTenantId(key, actor.tenant());
  if (prior.isPresent()) {
   TaskTree.require(prior.get().requestHash.equals(hash), "Event id reused with different content");
   return ack(prior.get());
  }
  // A source task maps to at most one HMG aggregate within the tenant.
  var bySource = tasks.findByTenantIdAndRequestKey(actor.tenant(), "platform:" + input.sourceTaskId());
  if (bySource.isPresent()) {
   events.saveAndFlush(event(key, actor.tenant(), "dispatch", input.sourceTaskId(), hash, bySource.get().id, "DUPLICATE"));
   return new Acknowledgement(input.eventId(), "DUPLICATE", bySource.get().id);
  }
  TaskTree tree = new TaskTree();
  tree.id = UUID.randomUUID().toString();
  tree.name = input.name();
  tree.vehicleId = null; // vehicle and sections are chosen at execution configure stage
  tree.workflowVersion = input.workflowDefinitionVersion();
  tree.root = new TaskTree.Node();
  tree.root.id = tree.id;
  tree.root.level = TaskTree.Level.MAIN;
  tree.root.executor = input.ownerId();
  tree.root.workflowInstanceId = input.sourceTaskId();
  tree.root.workflowRevision = input.workflowDefinitionVersion();
  tree.record(tree.root, "PLATFORM_DISPATCH", actor.user(), input.sourceRevision());

  TaskAggregate row = new TaskAggregate();
  row.id = tree.id; row.tenantId = actor.tenant();
  row.requestKey = "platform:" + input.sourceTaskId();
  row.requestHash = hash; row.payload = encode(tree);
  tasks.saveAndFlush(row);
  events.saveAndFlush(event(key, actor.tenant(), "dispatch", input.sourceTaskId(), hash, row.id, "ACCEPTED"));
  return new Acknowledgement(input.eventId(), "ACCEPTED", row.id);
 }

 @Transactional
 public Acknowledgement approval(ApprovalCallback input, Actor actor) {
  requireTenant(input.tenantId(), actor);
  String key = "approval:" + input.eventId();
  String hash = hash(input);
  var prior = events.findByIdAndTenantId(key, actor.tenant());
  if (prior.isPresent()) {
   TaskTree.require(prior.get().requestHash.equals(hash), "Event id reused with different content");
   return ack(prior.get());
  }
  var row = tasks.findByIdAndTenantId(input.businessId(), actor.tenant())
   .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  TaskTree tree = decode(row.payload);
  TaskTree.Node target = null;
  for (TaskTree.Node candidate : reviewNodes(tree.root)) {
   if (tree.matchesCallback(candidate, input.instanceId(), input.approvalId(), input.workflowRevision())) {
    target = candidate; break;
   }
  }
  // Stale, out-of-order or already-decided callback: acknowledge without mutation.
  if (target == null) {
   events.saveAndFlush(event(key, actor.tenant(), "approval", input.businessId(), hash, row.id, "IGNORED"));
   return new Acknowledgement(input.eventId(), "IGNORED", row.id);
  }
  boolean approve = input.decision().equalsIgnoreCase("APPROVE");
  TaskTree.require(approve || input.decision().equalsIgnoreCase("REJECT"), "Unsupported decision");
  tree.platformReview(target, input.actorId(), approve, input.actorId(),
   input.instanceId(), input.approvalId(), input.workflowRevision());
  row.payload = encode(tree);
  tasks.saveAndFlush(row);
  events.saveAndFlush(event(key, actor.tenant(), "approval", input.businessId(), hash, row.id, "APPLIED"));
  return new Acknowledgement(input.eventId(), "APPLIED", row.id);
 }

 private List<TaskTree.Node> reviewNodes(TaskTree.Node node) {
  java.util.List<TaskTree.Node> result = new java.util.ArrayList<>();
  if (node.state == TaskTree.State.REVIEWING) result.add(node);
  for (TaskTree.Node child : node.children) result.addAll(reviewNodes(child));
  return result;
 }
 private void requireTenant(String bodyTenant, Actor actor) {
  if (!bodyTenant.equals(actor.tenant())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tenant mismatch");
 }
 private Acknowledgement ack(PlatformEvent event) {
  // A repeated event id is always reported as DUPLICATE. resultJson keeps the first
  // processing outcome for audit only; replay must not present it as a fresh mutation.
  return new Acknowledgement(event.id.replaceFirst("^[^:]+:", ""), "DUPLICATE", event.businessId);
 }
 private PlatformEvent event(String id, String tenant, String kind, String businessId,
                             String hash, String resultBusinessId, String status) {
  PlatformEvent row = new PlatformEvent();
  row.id = id; row.tenantId = tenant; row.kind = kind; row.businessId = resultBusinessId;
  row.requestHash = hash; row.resultJson = status; row.createdAt = OffsetDateTime.now();
  return row;
 }
 private String encode(Object value) {
  try { return json.writeValueAsString(value); } catch (JsonProcessingException e) { throw new IllegalStateException(e); }
 }
 private TaskTree decode(String payload) {
  try { return json.readValue(payload, TaskTree.class); } catch (JsonProcessingException e) { throw new IllegalStateException(e); }
 }
 private String hash(Object value) {
  try {
   byte[] digest = MessageDigest.getInstance("SHA-256")
    .digest(json.writeValueAsBytes(value));
   return HexFormat.of().formatHex(digest);
  } catch (Exception e) { throw new IllegalStateException(e); }
 }
}
