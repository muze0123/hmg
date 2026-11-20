package com.metritag.hmg;
import java.util.List;
public class FieldValidationException extends RuntimeException {
 public record FieldError(String path, String code) {}
 public final List<FieldError> errors;
 public FieldValidationException(List<FieldError> errors) { super("Field validation failed"); this.errors = List.copyOf(errors); }
}
