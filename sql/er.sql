CREATE TABLE events (
    evnt_id INT,
  	evnt_title VARCHAR(50),
    evnt_time VARCHAR(30),
    evnt_desc VARCHAR(8000),
    PRIMARY KEY(evnt_id)
);

CREATE TABLE comments (
  	evnt_id INT,
    usr_id INT,
    comnt_text VARCHAR(8000),
    rating     INT,
    time_stamp VARCHAR(30),
  	FOREIGN KEY(evnt_id) REFERENCES events(evnt_id)
);

CREATE TABLE at (
    loc_name VARCHAR(8000),
    evnt_id INT,
    PRIMARY KEY(loc_name, evnt_id),
    FOREIGN KEY(loc_name) REFERENCES location_table(loc_name),
    FOREIGN KEY(evnt_id) REFERENCES events(evnt_id)
);

CREATE TABLE location_table (
    loc_name VARCHAR(8000),
    addy VARCHAR(8000),
    longitude VARCHAR(40),
    latitude VARCHAR(40),
    PRIMARY KEY(loc_name)
);

CREATE TABLE rso_events (
    evnt_id INT,
    evnt_time VARCHAR(30),
    evnt_desc VARCHAR(8000),
    PRIMARY KEY(evnt_id),
    FOREIGN KEY(evnt_id) REFERENCES events(evnt_id)
);

CREATE TABLE owns (
    usr_id INT,
    evnt_id INT,
    PRIMARY KEY (usr_id, evnt_id),
    FOREIGN KEY (usr_id) REFERENCES users (usr_id),
    FOREIGN KEY (evnt_id) REFERENCES rso_events (evnt_id)
);

CREATE TABLE private_events (
    evnt_id INT,
    evnt_time VARCHAR(30),
    evnt_desc VARCHAR(8000),
    PRIMARY KEY(evnt_id),
    FOREIGN KEY(evnt_id) REFERENCES events(evnt_id)
);

CREATE TABLE Creates (
    usr_id INT,
    evnt_id INT,
    PRIMARY KEY (usr_id, evnt_id),
    FOREIGN KEY (usr_id) REFERENCES users (usr_id),
    FOREIGN KEY (evnt_id) REFERENCES events (evnt_id)
);

CREATE TABLE public_events (
    evnt_id INT,
    evnt_time VARCHAR(30),
    evnt_desc VARCHAR(8000),
    PRIMARY KEY(evnt_id),
    FOREIGN KEY(evnt_id) REFERENCES events(evnt_id)
);

CREATE TABLE rsos (
    usr_id INT,
  	rso_id INT,
  	rso_title VARCHAR(50),
  	rso_members VARCHAR(8000),
    FOREIGN KEY(usr_id) REFERENCES users(usr_id),
    PRIMARY KEY(usr_id)
);

CREATE TABLE users (
    usr_id INT,
  	name VARCHAR(50),
  	password VARCHAR(50),
  	email VARCHAR(50),
    PRIMARY KEY(usr_id)
);

CREATE TABLE admins (
    usr_id INT,
  	password VARCHAR(50),
  	email VARCHAR(50),
    PRIMARY KEY(usr_id),
    FOREIGN KEY(usr_id) REFERENCES users(usr_id)
);

CREATE TABLE super_admins (
    usr_id INT,
  	password VARCHAR(50),
  	email VARCHAR(50),
    PRIMARY KEY(usr_id),
    FOREIGN KEY(usr_id) REFERENCES users(usr_id)
);

CREATE TABLE join_table (
    usr_id INT,
    PRIMARY KEY(usr_id),
    FOREIGN KEY(usr_id) REFERENCES users(usr_id)
);

CREATE TABLE universities (
    usr_id INT,
    univ_name VARCHAR(40),
    loc_name VARCHAR(8000),
    univ_desc VARCHAR(8000),
    num_students INT,
    PRIMARY KEY (usr_id),
    FOREIGN KEY (usr_id) REFERENCES super_admins (usr_id),
    FOREIGN KEY (loc_name) REFERENCES location_table (loc_name)
);

