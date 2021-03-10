package com.vogella.empri.server.data;

import javax.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.AllArgsConstructor;

@RestController
@RequestMapping(path = "/data_point")
@AllArgsConstructor
public class DataPointRestController {

	private DataPointRepository dataPointRepository;

	@PostMapping
	public ResponseEntity<Object> createDataPoint(@RequestBody @Valid DataPoint dataPoint) {
		dataPointRepository.save(dataPoint);
		return new ResponseEntity<>(HttpStatus.CREATED);
	}
}
