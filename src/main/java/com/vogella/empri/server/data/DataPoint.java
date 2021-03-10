package com.vogella.empri.server.data;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.validation.constraints.NotBlank;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "data_point")
@Data
@EqualsAndHashCode(callSuper = true)
public class DataPoint extends AbstractEntity {
	
	@NotBlank
	@Column(name = "xpath")
	private String xpath;
	@NotBlank
//	@Column(name = "url")
//	private String url;
	@NotBlank
	@Column(name = "most_significant_unit")
	private String mostSignificantUnit;

}
