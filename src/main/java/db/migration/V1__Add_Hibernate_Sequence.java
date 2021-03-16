package db.migration;

import org.springframework.jdbc.core.JdbcTemplate;

public class V1__Add_Hibernate_Sequence extends SpringJdbcMigration {

	@Override
	public void migrate(JdbcTemplate jc) throws Exception {
		jc.execute("create sequence hibernate_sequence start 1 increment 1");
	}

}
