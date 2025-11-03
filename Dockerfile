# 1. Start with the Python 3.13 image
FROM python:3.13


RUN apt-get update && apt-get install -y libgl1-mesa-glx

# 3. Set the working directory
WORKDIR /app

# 4. Copy requirements (for caching)
COPY requirements.txt .

# 5. Install all dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy the rest of your project code
COPY . .

# 7. Set the final working directory
WORKDIR /app/backend

# 8. Expose the port
EXPOSE 8080

# 9. The command to run your app
CMD ["python", "app.py"]