-- Table creation statements

CREATE TABLE events (
    evnt_id INT,
    evnt_title VARCHAR(50),
    evnt_time VARCHAR(30),
    evnt_desc VARCHAR(8000),
    approved BOOLEAN,
    evnt_type VARCHAR(50),
    PRIMARY KEY(evnt_id)
);

CREATE TABLE session_table (
    loggedIn BOOLEAN,
    username INT,
    email VARCHAR(50),
    usr_id INT,
    role VARCHAR(10)
);

CREATE TABLE comments (
    comment_id INT,
    evnt_id INT,
    comnt_text VARCHAR(8000),
    rating     INT,
    time_stamp VARCHAR(30),
    username INT,
    PRIMARY KEY(comment_id),
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
    latitude VARCHAR(40)
);

CREATE TABLE rso_events (
    evnt_id INT,
    evnt_title VARCHAR(50),
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
    evnt_title VARCHAR(50),
    evnt_time VARCHAR(30),
    evnt_desc VARCHAR(8000),
    PRIMARY KEY(evnt_id),
    FOREIGN KEY(evnt_id) REFERENCES events(evnt_id)
);

CREATE TABLE Creates (
    usr_id INT,
    evnt_id INT,
    rso_name VARCHAR(100),
    PRIMARY KEY (usr_id, evnt_id),
    FOREIGN KEY (usr_id) REFERENCES users (usr_id),
    FOREIGN KEY (evnt_id) REFERENCES events (evnt_id)
);

CREATE TABLE public_events (
    evnt_id INT,
    evnt_title VARCHAR(50),
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
    PRIMARY KEY(rso_id)
);

CREATE TABLE users (
    usr_id INT,
    username INT,
    name VARCHAR(50),
    password VARCHAR(50),
    email VARCHAR(50),
    PRIMARY KEY(usr_id)
);

CREATE TABLE admins (
    usr_id INT,
    username INT,
    password VARCHAR(50),
    email VARCHAR(50),
    PRIMARY KEY(usr_id),
    FOREIGN KEY(usr_id) REFERENCES users(usr_id)
);

CREATE TABLE super_admins (
    usr_id INT,
    username INT,
    password VARCHAR(50),
    email VARCHAR(50),
    PRIMARY KEY(usr_id),
    FOREIGN KEY(usr_id) REFERENCES users(usr_id)
);

CREATE TABLE join_table (
    usr_id INT,
    evnt_id INT,
    rso_id INT,
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

-- CHECK Constraints
ALTER TABLE events
ADD CONSTRAINT approved_check CHECK (approved IN (FALSE, TRUE));

-- CREATE ASSERTION
CREATE ASSERTION check_session_table_role
CHECK (
    role IN ('admin', 'user', 'super_admin')
);

-- CREATE TRIGGER for comments table
CREATE OR REPLACE FUNCTION check_rating() RETURNS TRIGGER AS $check_rating$
BEGIN
    IF NEW.rating < 0 OR NEW.rating > 5 THEN
        RAISE EXCEPTION 'Rating must be between 0 and 5';
    END IF;
    RETURN NEW;
END;
$check_rating$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_rating_check
BEFORE INSERT OR UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION check_rating();

-- CREATE TRIGGER for universities table
CREATE OR REPLACE FUNCTION check_num_students() RETURNS TRIGGER AS $check_num_students$
BEGIN
    IF NEW.num_students < 0 THEN
        RAISE EXCEPTION 'Number of students must be non-negative';
    END IF;
    RETURN NEW;
END;
$check_num_students$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_num_students_check
BEFORE INSERT OR UPDATE ON universities
FOR EACH ROW EXECUTE FUNCTION check_num_students();
