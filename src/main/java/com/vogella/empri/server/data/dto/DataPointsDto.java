package com.vogella.empri.server.data.dto;

import java.util.List;
import java.util.UUID;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

import lombok.Data;

@Data
public class DataPointsDto {

	@NotNull
	private UUID participantIdentifier;
	@Valid
	@NotEmpty
	private List<DataPointDto> entries;

}
