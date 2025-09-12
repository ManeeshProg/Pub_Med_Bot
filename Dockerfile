# Base image with Node.js
FROM node:20-slim

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Set the working directory
WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# Copy and install Node.js dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the necessary ports
EXPOSE 8000 8001 8002 5000 5173

# Make the startup script executable
RUN chmod +x start.sh

# Set the command to run the startup script
CMD ["./start.sh"]
