package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

public abstract class SpringJdbcMigration extends BaseJavaMigration {

	@Override
	public void migrate(Context context) throws Exception {
		migrate(new JdbcTemplate(new SingleConnectionDataSource(context.getConnection(), true)));
	}

	public abstract void migrate(JdbcTemplate jc) throws Exception;
}