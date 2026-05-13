CREATE USER identity WITH PASSWORD 'identity';
CREATE DATABASE identity_db OWNER identity;

CREATE USER catalog WITH PASSWORD 'catalog';
CREATE DATABASE catalog_db OWNER catalog;

CREATE USER booking WITH PASSWORD 'booking';
CREATE DATABASE booking_db OWNER booking;

CREATE USER payment WITH PASSWORD 'payment';
CREATE DATABASE payment_db OWNER payment;

CREATE USER strapi WITH PASSWORD 'strapi';
CREATE DATABASE content_db OWNER strapi;

CREATE USER pact_broker WITH PASSWORD 'pact_broker';
CREATE DATABASE pact_broker_db OWNER pact_broker;
