package com.vogella.empri.server.config.validation;

import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.mapping;
import static java.util.stream.Collectors.toList;

import java.util.List;
import java.util.Map;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class ErrorToJsonTranslatorService {
	
	private MessageSource messageSource;

	public Map<String, List<String>> translate(BindingResult br) {
		return br.getFieldErrors().stream()
				.collect(groupingBy(FieldError::getField, mapping(
						e -> messageSource.getMessage(e, LocaleContextHolder.getLocale()), toList())));
	}
}
