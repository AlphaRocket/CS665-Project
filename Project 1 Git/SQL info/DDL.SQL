-- public.customers definition

-- Drop table

-- DROP TABLE public.customers;

CREATE TABLE public.customers (
	customer_id int4 DEFAULT nextval('customers_customerid_seq'::regclass) NOT NULL,
	first_name varchar(50) NOT NULL,
	last_name varchar(50) NOT NULL,
	email varchar(255) NOT NULL,
	"password" text NULL,
	CONSTRAINT customers_pk PRIMARY KEY (customer_id),
	CONSTRAINT customers_unique UNIQUE (email)
);


-- public.drink_options definition

-- Drop table

-- DROP TABLE public.drink_options;

CREATE TABLE public.drink_options (
	option_id int4 DEFAULT nextval('drinkoptions_optionid_seq'::regclass) NOT NULL,
	option_type varchar(50) NULL,
	option_name varchar(50) NOT NULL,
	price numeric(10, 2) NOT NULL,
	inventory int4 NULL,
	CONSTRAINT drinkoptions_pk PRIMARY KEY (option_id),
	CONSTRAINT drinkoptions_unique UNIQUE (option_name)
);


-- public.drink_sodas definition

-- Drop table

-- DROP TABLE public.drink_sodas;

CREATE TABLE public.drink_sodas (
	soda_name varchar NOT NULL,
	soda_id int4 DEFAULT nextval('drinksodas_sodaid_seq'::regclass) NOT NULL,
	CONSTRAINT drinksodas_pk PRIMARY KEY (soda_id),
	CONSTRAINT drinksodas_unique UNIQUE (soda_name)
);


-- public.employees definition

-- Drop table

-- DROP TABLE public.employees;

CREATE TABLE public.employees (
	first_name varchar(50) NOT NULL,
	last_name varchar(50) NOT NULL,
	email varchar(255) NOT NULL,
	"password" text NOT NULL,
	hire_date date NOT NULL,
	employeeid serial4 NOT NULL,
	CONSTRAINT employees_pk PRIMARY KEY (employeeid)
);


-- public.orders definition

-- Drop table

-- DROP TABLE public.orders;

CREATE TABLE public.orders (
	order_id int4 DEFAULT nextval('order_orderid_seq'::regclass) NOT NULL,
	customer_id int4 NOT NULL,
	order_date date NOT NULL,
	total_price numeric(10, 2) NULL,
	CONSTRAINT order_pk PRIMARY KEY (order_id),
	CONSTRAINT order_customers_fk FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE ON UPDATE CASCADE
);


-- public.prebuilt_drinks definition

-- Drop table

-- DROP TABLE public.prebuilt_drinks;

CREATE TABLE public.prebuilt_drinks (
	drink_id int4 DEFAULT nextval('prebuiltdrinks_drinkid_seq'::regclass) NOT NULL,
	drink_name varchar(25) NOT NULL,
	base_soda int4 NULL,
	base_price numeric(10, 2) NULL,
	CONSTRAINT prebuiltdrinks_pk PRIMARY KEY (drink_id),
	CONSTRAINT prebuiltdrinks_unique UNIQUE (drink_name),
	CONSTRAINT prebuiltdrinks_drinksodas_fk FOREIGN KEY (base_soda) REFERENCES public.drink_sodas(soda_id)
);


-- public.order_drinks definition

-- Drop table

-- DROP TABLE public.order_drinks;

CREATE TABLE public.order_drinks (
	order_drink_id varchar NOT NULL,
	order_id int4 NOT NULL,
	drink_id int4 NULL,
	"size" varchar(20) NOT NULL,
	selected_soda int4 NULL,
	customer_notes varchar(255) NULL,
	CONSTRAINT orderdrinks_pk PRIMARY KEY (order_drink_id),
	CONSTRAINT orderdrinks_drinksodas_fk FOREIGN KEY (selected_soda) REFERENCES public.drink_sodas(soda_id),
	CONSTRAINT orderdrinks_order_fk FOREIGN KEY (order_id) REFERENCES public.orders(order_id),
	CONSTRAINT orderdrinks_prebuiltdrinks_fk FOREIGN KEY (drink_id) REFERENCES public.prebuilt_drinks(drink_id)
);


-- public.prebuilt_drink_selections definition

-- Drop table

-- DROP TABLE public.prebuilt_drink_selections;

CREATE TABLE public.prebuilt_drink_selections (
	drink_id int4 NOT NULL,
	option_id int4 NOT NULL,
	CONSTRAINT prebuiltdrinkoptions_pk PRIMARY KEY (drink_id, option_id),
	CONSTRAINT prebuiltdrinkoptions_drinkoptions_fk FOREIGN KEY (option_id) REFERENCES public.drink_options(option_id),
	CONSTRAINT prebuiltdrinkoptions_prebuiltdrinks_fk FOREIGN KEY (drink_id) REFERENCES public.prebuilt_drinks(drink_id)
);


-- public.order_drink_selections definition

-- Drop table

-- DROP TABLE public.order_drink_selections;

CREATE TABLE public.order_drink_selections (
	order_drink_id varchar NOT NULL,
	option_id int4 NOT NULL,
	CONSTRAINT drinkoptionselections_pk PRIMARY KEY (order_drink_id, option_id),
	CONSTRAINT drinkoptionselections_drinkoptions_fk FOREIGN KEY (option_id) REFERENCES public.drink_options(option_id),
	CONSTRAINT drinkoptionselections_orderdrinks_fk FOREIGN KEY (order_drink_id) REFERENCES public.order_drinks(order_drink_id)
);