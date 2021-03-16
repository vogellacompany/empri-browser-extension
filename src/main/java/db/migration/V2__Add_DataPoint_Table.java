package db.migration;

import org.springframework.jdbc.core.JdbcTemplate;

public class V2__Add_DataPoint_Table extends SpringJdbcMigration {

	@Override
	public void migrate(JdbcTemplate jc) throws Exception {
		jc.execute(
				"CREATE TABLE data_point (id int8 NOT NULL, url text, xpath text, most_significant_unit text, primary key (id))");
	}

}
