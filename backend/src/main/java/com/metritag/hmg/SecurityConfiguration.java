package com.metritag.hmg;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
@Configuration
public class SecurityConfiguration {
 @Bean @Profile("!dev")
 SecurityFilterChain production(HttpSecurity http) throws Exception {
  return http.csrf(c -> c.disable()).sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
   .authorizeHttpRequests(a -> a.anyRequest().authenticated()).oauth2ResourceServer(o -> o.jwt(j -> {})).build();
 }
 @Bean @Profile("dev")
 SecurityFilterChain development(HttpSecurity http) throws Exception {
  return http.csrf(c -> c.disable()).sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
   .authorizeHttpRequests(a -> a.anyRequest().authenticated()).httpBasic(b -> {}).build();
 }
 @Bean @Profile("dev")
 UserDetailsService developmentUsers() {
  return new InMemoryUserDetailsManager(
   User.withUsername("a.executor").password("{noop}development-only").roles("DEV").build(),
   User.withUsername("a.reviewer").password("{noop}development-only").roles("DEV").build(),
   User.withUsername("b.executor").password("{noop}development-only").roles("DEV").build());
 }
}
