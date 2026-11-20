package com.metritag.hmg;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.core.env.Environment;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;
@Service
public class TemplateService {
 private final TemplateRepository repository;
 private final ObjectMapper json;
 private final Environment environment;
 public record View(String id, boolean published, TemplateSchema schema) {}
 public TemplateService(TemplateRepository repository, ObjectMapper json, Environment environment) {
  this.repository=repository; this.json=json; this.environment=environment;
 }
 public List<View> list(Actor actor) { return repository.findByTenantIdOrderByTemplateIdAscRevisionAsc(actor.tenant()).stream().map(this::view).toList(); }
 private TemplateVersion load(String id, Actor actor) {
  return repository.findByIdAndTenantId(id,actor.tenant()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
 }
 public View get(String id, Actor actor) { return view(load(id,actor)); }
 private View view(TemplateVersion row) {
  try { return new View(row.id,row.published,json.readValue(row.schemaJson,TemplateSchema.class)); }
  catch (JsonProcessingException e) { throw new IllegalStateException(e); }
 }
 private void authorizeWrite() {
  if (!environment.matchesProfiles("dev")) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Platform template permissions are not connected");
 }
 @Transactional public View create(TemplateSchema schema, Actor actor) {
  authorizeWrite(); schema.checkDefinition();
  TemplateVersion row=new TemplateVersion(); row.id=UUID.randomUUID().toString(); row.tenantId=actor.tenant();
  row.templateId=schema.templateId(); row.revision=schema.revision();
  try { row.schemaJson=json.writeValueAsString(schema); } catch (JsonProcessingException e) { throw new IllegalStateException(e); }
  return view(repository.saveAndFlush(row));
 }
 @Transactional public View publish(String id, Actor actor) {
  authorizeWrite(); var row=load(id,actor); row.published=true; return view(repository.saveAndFlush(row));
 }
 public TemplateSchema bind(String id, TaskTree.Kind kind, String regulation, Actor actor) {
  var row=load(id,actor); TaskTree.require(row.published,"Template version must be published"); var schema=view(row).schema();
  TaskTree.require(schema.kind()==kind,"Template kind does not match task");
  if (kind != TaskTree.Kind.VEHICLE) TaskTree.require(Objects.equals(schema.regulationId(),regulation),"Template regulation does not match task");
  return schema;
 }
}
