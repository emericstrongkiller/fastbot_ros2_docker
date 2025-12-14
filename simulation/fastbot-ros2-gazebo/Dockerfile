# Start from ROS base image
FROM osrf/ros:humble-desktop-full

# Make a catkin workspace
RUN mkdir -p /home/catkin_ws/src/simulation

# Exporting a variable to install pkgs without any interactive questions
ENV DEBIAN_FRONTEND=noninteractive

# Install Git & other things
RUN apt-get update && apt-get install -y \
    git \
	ros-humble-gazebo-ros-pkgs

COPY ./fastbot_description /home/catkin_ws/src/fastbot_description
COPY ./fastbot_gazebo /home/catkin_ws/src/fastbot_gazebo

RUN /bin/bash -c "source /opt/ros/humble/setup.bash \
    && cd /home/catkin_ws \
    && colcon build"

# Add sourcing to bashrc so it happens automatically in every shell
RUN echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc \
    && echo "source /home/catkin_ws/install/setup.bash" >> ~/.bashrc

#ENV ROS_MASTER_URI http://sim_1:11311/
ENV ROS_DOMAIN_ID 1

# /bin/bash is the command we want to execute when running a docker container
ENTRYPOINT ["/bin/bash", "-i", "-c", "ros2 launch fastbot_gazebo one_fastbot_room.launch.py"]