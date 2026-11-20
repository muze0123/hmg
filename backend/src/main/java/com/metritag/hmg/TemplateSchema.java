package com.metritag.hmg;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

public record TemplateSchema(
 @NotBlank @Size(max=100) String templateId,
 @NotBlank @Size(max=50) String revision,
 @NotBlank @Size(max=200) String name,
 @NotNull TaskTree.Kind kind,
 String regulationId,
 @NotEmpty @Size(max=500) List<@NotNull @Valid Field> fields
) {
 public enum Format { TEXT, NUMBER, ORDERED, RICH, TABLE }
 public record Field(@NotBlank @Size(max=100) String id, @NotBlank @Size(max=200) String label,
  @NotNull Format format, boolean required, BigDecimal minimum, BigDecimal maximum,
  @Min(1) @Max(100000) Integer maxLength, @Size(max=50) List<@Valid Column> columns) {}
 public record Column(@NotBlank String id, @NotBlank String label, @NotNull Format format, boolean required) {}
 public void checkDefinition() {
  Set<String> ids = new HashSet<>();
  for (Field field : fields) {
   TaskTree.require(ids.add(field.id()), "Duplicate field ID");
   TaskTree.require(field.minimum() == null || field.maximum() == null || field.minimum().compareTo(field.maximum()) <= 0, "Invalid numeric bounds");
   if (field.format() == Format.TABLE) {
    TaskTree.require(field.columns() != null && !field.columns().isEmpty(), "Table columns are required");
    Set<String> columns = new HashSet<>();
    for (Column column : field.columns()) {
     TaskTree.require(column != null && columns.add(column.id()), "Duplicate or null table column");
     TaskTree.require(column.format() == Format.TEXT || column.format() == Format.NUMBER, "Table columns support TEXT or NUMBER");
    }
   } else TaskTree.require(field.columns() == null || field.columns().isEmpty(), "Only table fields have columns");
  }
 }
}
