package com.livebid;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // For Phase 4: Auction Closing Task
public class LiveBidApplication {

	public static void main(String[] args) {
		SpringApplication.run(LiveBidApplication.class, args);
	}

}
