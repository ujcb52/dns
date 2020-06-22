import requests


class Crowd:
    CROWD_BASE_URL = 'input uri'
    CROWD_USERNAME = 'input id'
    CROWD_PASSWORD = 'input pass'
    auth = (CROWD_USERNAME, CROWD_PASSWORD)

    def login(self, username, password):
        url = self.CROWD_BASE_URL + '/rest/usermanagement/latest/session'
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        data = dict(username=username, password=password)
        resp = requests.post(url, headers=headers, json=data, auth=self.auth)
        resp = resp.json()
        if not 'token' in resp:
            return False
        return True

    def getUserInfo(self, username):
        url = self.CROWD_BASE_URL + '/rest/usermanagement/latest/user?username=' + username
        headers = {
            'Accept': 'application/json'
        }
        resp = requests.get(url, headers=headers, auth=self.auth)
        resp = resp.json()
        if not 'name' in resp:
            return False
        return resp
