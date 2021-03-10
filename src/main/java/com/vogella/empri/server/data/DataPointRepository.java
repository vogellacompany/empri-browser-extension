package com.vogella.empri.server.data;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DataPointRepository extends JpaRepository<DataPoint, Long> {
	
}
