DROP TABLE IF EXISTS books;

CREATE TABLE books (
id SERIAL PRIMARY KEY,
title VARCHAR(255),
author VARCHAR (225),
isbn VARCHAR (225),
date VARCHAR (225),
image_url VARCHAR (225),
description TEXT
);