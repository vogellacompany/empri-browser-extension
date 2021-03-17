package com.vogella.empri.server.data;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.vogella.empri.server.data.dto.DataPointsDto;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service("dataPointService")
public class DataPointService {

	private DataPointRepository dataPointRepository;

	public void save(DataPointsDto dataPoints) {
		List<DataPoint> entries = dataPoints.getEntries().stream()
				.map(entry -> entry.toDataPoint(dataPoints.getParticipantIdentifier())).collect(Collectors.toList());
		dataPointRepository.saveAll(entries);
	}

}
