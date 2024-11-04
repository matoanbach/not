import requests

# LeetCode credentials and URLs
username = 'matoanbach'
password = 'toantoan1'
login_url = 'https://leetcode.com/accounts/login/'
submit_url = 'https://leetcode.com/problems/{problem_slug}/submit/'

# Log in to LeetCode
session = requests.Session()
session.get(login_url)  # Establish initial session

# Perform the login request with the CSRF token
csrf_token = session.cookies.get('csrftoken')
login_payload = {
    'login': username,
    'password': password,
    'csrfmiddlewaretoken': csrf_token,
}
headers = {
    'referer': login_url,
    'x-csrftoken': csrf_token,
}
session.post(login_url, data=login_payload, headers=headers)

# Submit the solution
problem_slug = 'two-sum'  # Replace with the actual problem slug
code = '''
class Solution:
    def twoSum(self, nums, target):
        hashmap = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in hashmap:
                return [hashmap[complement], i]
            hashmap[num] = i
'''
submission_payload = {
    'lang': 'python3',
    'question_id': '1',  # Replace with the actual question ID
    'typed_code': code,
    'csrfmiddlewaretoken': csrf_token,
}
submit_headers = {
    'referer': f'https://leetcode.com/problems/{problem_slug}/',
    'x-csrftoken': csrf_token,
}
response = session.post(submit_url.format(problem_slug=problem_slug),
                        data=submission_payload,
                        headers=submit_headers)

print(response.text)
