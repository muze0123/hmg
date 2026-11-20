package com.metritag.hmg;

import java.util.*;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;
import static com.metritag.hmg.TemplateSchema.*;
import static com.metritag.hmg.FieldValidationException.FieldError;

@Component
public class TemplateValidator {
 public void validate(TemplateSchema schema, Map<String,Object> values, boolean complete) {
  List<FieldError> errors = new ArrayList<>();
  if (values == null) values = Map.of();
  Set<String> known = new HashSet<>();
  for (Field field : schema.fields()) {
   known.add(field.id()); Object value = values.get(field.id());
   if (empty(value)) {
    if (complete && field.required()) errors.add(new FieldError(field.id(), "required"));
    continue;
   }
   if (field.format() != Format.TABLE) {
    scalar(field.id(), field.format(), value, field.minimum(), field.maximum(), field.maxLength(), errors);
    continue;
   }
   if (!(value instanceof List<?> rows) || rows.size() > 1000) { errors.add(new FieldError(field.id(), "table")); continue; }
   Set<String> columns = new HashSet<>();
   for (Column column : field.columns()) columns.add(column.id());
   for (int index = 0; index < rows.size(); index++) {
    String path = field.id() + "." + index;
    if (!(rows.get(index) instanceof Map<?,?> row)) { errors.add(new FieldError(path, "table")); continue; }
    for (Object key : row.keySet()) if (!columns.contains(String.valueOf(key))) errors.add(new FieldError(path+"."+key,"unknown"));
    for (Column column : field.columns()) {
     Object cell = row.get(column.id()); String cellPath = path+"."+column.id();
     if (empty(cell)) { if (complete && column.required()) errors.add(new FieldError(cellPath,"required")); }
     else scalar(cellPath,column.format(),cell,null,null,100000,errors);
    }
   }
  }
  for (String key : values.keySet()) if (!known.contains(key)) errors.add(new FieldError(key,"unknown"));
  if (!errors.isEmpty()) throw new FieldValidationException(errors);
 }
 private boolean empty(Object value) {
  return value == null || value instanceof String text && text.replaceAll("<[^>]*>", "").replace("&nbsp;", " ").isBlank()
   || value instanceof List<?> list && list.isEmpty();
 }
 private void scalar(String path, Format format, Object value, BigDecimal min, BigDecimal max, Integer length, List<FieldError> errors) {
  if (format == Format.NUMBER || format == Format.ORDERED) {
   if (!(value instanceof Number)) { errors.add(new FieldError(path,"number")); return; }
   try {
    BigDecimal number = new BigDecimal(value.toString());
    if (format == Format.ORDERED && (number.signum() <= 0 || number.stripTrailingZeros().scale() > 0)) errors.add(new FieldError(path,"positiveInteger"));
    if (min != null && number.compareTo(min) < 0 || max != null && number.compareTo(max) > 0) errors.add(new FieldError(path,"range"));
   } catch (NumberFormatException e) { errors.add(new FieldError(path,"number")); }
  } else {
   if (!(value instanceof String text)) { errors.add(new FieldError(path,"text")); return; }
   if (text.length() > (length == null ? 100000 : length)) errors.add(new FieldError(path,"length"));
  }
 }
}
