package com.vogella.empri.server.config.validation;

import java.util.List;
import java.util.Map;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

import lombok.AllArgsConstructor;

@ControllerAdvice
@Order(value = Ordered.HIGHEST_PRECEDENCE)
@AllArgsConstructor
public class RestApiValidationExceptionHandler {

	private ErrorToJsonTranslatorService errorTranslatorService;

	@ExceptionHandler(MethodArgumentNotValidException.class)
	@ResponseStatus(code = HttpStatus.UNPROCESSABLE_ENTITY)
	public ResponseEntity<Map<String, List<String>>> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
		return new ResponseEntity<>(errorTranslatorService.translate(ex.getBindingResult()),
				HttpStatus.UNPROCESSABLE_ENTITY);
	}

}