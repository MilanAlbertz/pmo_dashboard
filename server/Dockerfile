FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# MySQL Database Configuration - These will be overridden by docker-compose
ENV DB_HOST=db
ENV DB_USER=Milan
ENV DB_PASSWORD=B@iley2003
ENV DB_NAME=pmo_office_db

EXPOSE 5001
CMD ["npm", "start"] 