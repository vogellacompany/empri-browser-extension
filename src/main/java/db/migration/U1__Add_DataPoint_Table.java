package db.migration;

import org.springframework.jdbc.core.JdbcTemplate;

public class U1__Add_DataPoint_Table extends SpringJdbcMigration {

	@Override
	public void migrate(JdbcTemplate jc) throws Exception {
		jc.execute("DROP TABLE data_point");
	}

}
