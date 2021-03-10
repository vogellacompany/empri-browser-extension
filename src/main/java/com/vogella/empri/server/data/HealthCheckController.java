package com.vogella.empri.server.data;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HealthCheckController {

	@GetMapping(path = "/health_check")
	public ResponseEntity<Object> healthCheck() {
		return ResponseEntity.noContent().build();
	}
}
