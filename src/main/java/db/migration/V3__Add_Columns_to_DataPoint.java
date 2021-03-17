package db.migration;

import org.springframework.jdbc.core.JdbcTemplate;

public class V3__Add_Columns_to_DataPoint extends SpringJdbcMigration {

	@Override
	public void migrate(JdbcTemplate jc) throws Exception {
		jc.execute(
				"ALTER TABLE data_point ADD COLUMN participant_identifier UUID, ADD COLUMN days_since_opt_in int4, ADD COLUMN frequency int4");
	}	
}
