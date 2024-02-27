CREATE TABLE events (
    evnt_id INT,
    evnt_time VARCHAR(30),
    evnt_desc VARCHAR(Max),
    PRIMARY KEY(evnt_id)
);

CREATE TABLE comments (
    comnt_text VARCHAR(Max),
    rating     INT,
    time_stamp VARCHAR(30)
);

CREATE TABLE at (
    loc_name VARCHAR(30),
    evnt_id INT,
    PRIMARY KEY(loc_name, evnt_id)
    FOREIGN KEY(loc_name) References location_table(loc_name),
    FOREIGN KEY(evnt_id) References events(evnt_id),
);

CREATE TABLE location_table (
    loc_name VARCHAR(30),
    addy VARCHAR(30),
    longitude VARCHAR(40),
    latitude VARCHAR(40),
    PRIMARY KEY(loc_name)
);

CREATE TABLE rso_events (
    evnt_id INT,
    evnt_time VARCHAR(30),
    evnt_desc VARCHAR(Max),
    PRIMARY KEY(evnt_id),
    FOREIGN KEY(evnt_id, evnt_time, evnt_desc) References events(evnt_id, evnt_time, evnt_desc)
);

CREATE TABLE owns (
    usr_id	INT,
	evnt_id	INT,
	Primary Key (usr_id, evnt_id),
	Foreign Key (usr_id) References users (usr_id),
	Foreign Key (evnt_id) References rso (evnt_id)
);

CREATE TABLE private_events (
    evnt_id INT,
    evnt_time VARCHAR(30),
    evnt_desc VARCHAR(Max),
    PRIMARY KEY(evnt_id),
    FOREIGN KEY(evnt_id, evnt_time, evnt_desc) References events(evnt_id, evnt_time, evnt_desc)
);

Create Table Creates (
	usr_id	INT,
    evnt_id INT,
    Primary Key (Usr_id, evnt_id),
    Foreign Key (usr_id) References users (usr_id),
    Foreign Key (evnt_id) References events (evnt_id)
);

CREATE TABLE public_events (
    evnt_id INT,
    evnt_time VARCHAR(30),
    evnt_desc VARCHAR(Max),
    PRIMARY KEY(evnt_id ),
    FOREIGN KEY(evnt_id, evnt_time, evnt_desc) References events(evnt_id, evnt_time, evnt_desc),
);

CREATE TABLE rsos (
    usr_id INT,


    FOREIGN KEY(usr_id) references join(usr_id),
    PRIMARY KEY(usr_id)
);

CREATE TABLE users (
    usr_id INT,
    PRIMARY KEY(usr_id)
);

CREATE TABLE admins (
    usr_id INT,
    PRIMARY KEY(usr_id),
    FOREIGN KEY(usr_id) References users(usr_id)
);

CREATE TABLE super_admins (
    usr_id INT,
    PRIMARY KEY(usr_id),
    FOREIGN KEY(usr_id) References users(usr_id)
);

CREATE TABLE join_table (
    usr_id INT,
    PRIMARY KEY(usr_id)
    FOREIGN KEY(usr_id) References users(usr_id),
);

Create Table universities (
	usr_id 		     INT,
	univ_name 		 VARCHAR(40),
	loc_name	     VARCHAR(50),
	univ_desc	     VARCHAR(Max),
	num_students     INT,
	Primary Key (u_id),
	Foreign Key (usr_id) References SuperAdmin (usr_id),
	Foreign Key (loc_name) References Location (loc_name)
);