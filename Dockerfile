# 1. Start with an official Python 3.10 image
FROM python:3.10-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy the requirements file first (for better caching)
COPY requirements.txt .

# 4. Install all the dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of your project code into the container
COPY . .

# 6. Set the working directory to the backend folder
WORKDIR /app/backend

# 7. Expose the port your app runs on (your README says 8080)
EXPOSE 8080

# 8. The command to run your Flask app
CMD ["python", "app.py"]