# Start from ROS base image
FROM arm64v8/ros:humble

# Make a catkin workspace
RUN mkdir -p /home/catkin_ws/src/simulation

# Exporting a variable to install pkgs without any interactive questions
ENV DEBIAN_FRONTEND=noninteractive

# Install Git & other things
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    python3-tornado \
    python3-bson \
    python3-cbor2 \
    ros-humble-ament-cmake-mypy \
    ros-humble-tf2-web-republisher \
    && cd /home/catkin_ws/src && git clone -b humble https://github.com/RobotWebTools/rosbridge_suite.git

RUN /bin/bash -c "source /opt/ros/humble/setup.bash \
    && cd /home/catkin_ws \
    && colcon build"

# Add sourcing to bashrc so it happens automatically in every shell
RUN echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc \
    && echo "source /home/catkin_ws/install/setup.bash" >> ~/.bashrc

ENV ROS_DOMAIN_ID 1

# /bin/bash is the command we want to execute when running a docker container
ENTRYPOINT ["/bin/bash", "-i", "-c", "cd /home/catkin_ws/src/simulation/ && python3 -m http.server 7000 & ros2 launch rosbridge_server rosbridge_websocket_launch.xml & wait"]