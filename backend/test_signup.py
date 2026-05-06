import urllib.request, urllib.error, json

try:
    req = urllib.request.Request(
        'http://localhost:5000/api/auth/signup',
        data=json.dumps({'name':'Alex', 'email':'alex123@gmail.com', 'password':'test'}).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Origin': 'http://localhost:5173'}
    )
    res = urllib.request.urlopen(req)
    print(res.read())
except urllib.error.HTTPError as e:
    print(e.headers)
    print(e.read())
