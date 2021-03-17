package com.vogella.empri.server.data.dto;

import java.util.UUID;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

import com.vogella.empri.server.data.DataPoint;

import lombok.Data;

@Data
public class DataPointDto {

	@NotBlank
	private String xpath;
	@NotBlank
	private String url;
	@NotBlank
	private String mostSignificantUnit;
	@NotNull
	private Integer daysSinceOptIn;
	@NotNull
	private Integer frequency;

	public DataPoint toDataPoint(UUID participantIdentifier) {
		return DataPoint.builder().xpath(xpath).url(url).mostSignificantUnit(mostSignificantUnit)
				.daysSinceOptIn(daysSinceOptIn).frequency(frequency).participantIdentifier(participantIdentifier)
				.build();
	}

}
