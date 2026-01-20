Place the provided robot image in this folder and name it exactly: robot.png

Path: static/images/robot.png

The signup template references this file with:
    {{ url_for('static', filename='images/robot.png') }}

If you want a different filename, update templates/signup.html accordingly.
