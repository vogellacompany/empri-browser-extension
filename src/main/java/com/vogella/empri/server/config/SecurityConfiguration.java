package com.vogella.empri.server.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;

@Configuration
public class SecurityConfiguration extends WebSecurityConfigurerAdapter {
	
	@Value("${BROWSER_USER}")
    private String browserUser;
	@Value("${BROWSER_PASSWORD}")
    private String browserPassword;

    @Override
	protected void configure(HttpSecurity http) throws Exception {
		http.csrf().disable();
		http.cors().configurationSource(request -> new CorsConfiguration().applyPermitDefaultValues());
		http.formLogin().disable().httpBasic().and().authorizeRequests().antMatchers("/health_check").permitAll()
				.anyRequest().authenticated();
    }
    
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.inMemoryAuthentication()
				.passwordEncoder(passwordEncoder())
                .withUser(browserUser)
				.password(passwordEncoder().encode(browserPassword))
				.roles("USER");
    }
    
	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
