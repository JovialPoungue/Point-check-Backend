{
  "version": 2,
  "buildCommand": "pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate --noinput",
  "builds": [
    {
      "src": "pointcheck/wsgi.py",
      "use": "@vercel/python",
      "config": { "maxLambdaSize": "15mb", "runtime": "python3.12" }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "pointcheck/wsgi.py"
    }
  ]
}