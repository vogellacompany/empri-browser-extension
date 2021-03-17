package com.vogella.empri.server.data;

import java.util.UUID;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "data_point")
@Data
@EqualsAndHashCode(callSuper = true)
@Builder
public class DataPoint extends AbstractEntity {
	
	@NotBlank
	@Column(name = "xpath")
	private String xpath;
	@NotBlank
	@Column(name = "url")
	private String url;
	@NotBlank
	@Column(name = "most_significant_unit")
	private String mostSignificantUnit;
	@Column(name = "days_since_opt_in")
	private Integer daysSinceOptIn;
	@Column(name = "frequency")
	private Integer frequency;
	@NotNull
	@Column(name = "participant_identifier")
	private UUID participantIdentifier;

}
