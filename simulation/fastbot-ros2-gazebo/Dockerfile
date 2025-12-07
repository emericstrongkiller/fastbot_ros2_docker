FROM osrf/ros:humble-desktop-full

ENV DEBIAN_FRONTEND=noninteractive

# Install Gazebo
RUN apt-get update && apt-get install -y \
    ros-humble-gazebo-ros-pkgs \
    ros-humble-gazebo-ros2-control \
    && rm -rf /var/lib/apt/lists/*

# Source ROS setup in bashrc
RUN echo "source /opt/ros/humble/setup.bash" >> ~/.bashrc

WORKDIR /root

ENTRYPOINT ["/bin/bash"]