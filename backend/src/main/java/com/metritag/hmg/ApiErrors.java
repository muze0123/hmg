package com.metritag.hmg;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
@RestControllerAdvice
public class ApiErrors {
 @ExceptionHandler(FieldValidationException.class) @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
 public Map<String,Object> fields(FieldValidationException error) { return Map.of("code","FIELD_VALIDATION","errors",error.errors); }
 @ExceptionHandler(BusinessException.class) @ResponseStatus(HttpStatus.CONFLICT)
 public Map<String,String> business(BusinessException error) { return Map.of("code", "BUSINESS_CONFLICT", "message", error.getMessage()); }
 @ExceptionHandler({DataIntegrityViolationException.class, ObjectOptimisticLockingFailureException.class})
 @ResponseStatus(HttpStatus.CONFLICT)
 public Map<String,String> conflict(Exception error) { return Map.of("code", "CONCURRENT_CONFLICT", "message", "Reload the task and retry"); }
}
