#!/bin/sh

echo "Stopping firewall and allowing everyone..."
ipt="/sbin/iptables"
## Failsafe - die if /sbin/iptables not found 
[ ! -x "$ipt" ] && { echo "$0: \"${ipt}\" command not found."; exit 1; }

$ipt -P INPUT ACCEPT
$ipt -P FORWARD ACCEPT
$ipt -P OUTPUT ACCEPT
$ipt -F
$ipt -X
$ipt -t nat -F
$ipt -t nat -X
$ipt -t mangle -F
$ipt -t mangle -X
$ipt -t raw -F
$ipt -t raw -X

echo "Adding rules so that only SMTP(S),SSH,HTTP(S) and DNS are allowed... Now added rule for jenkins server"
$ipt -A INPUT -p tcp -m tcp -m multiport --dports 22,80,443,67,68,8080 -j ACCEPT
$ipt -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
$ipt -A INPUT -i lo -p all -j ACCEPT
$ipt -A INPUT -p tcp -j TARPIT
$ipt -A INPUT -j DROP

$ipt -A OUTPUT -p tcp -m tcp -m multiport --dports 25,53,67,68,80,443,465,587 -j ACCEPT
$ipt -A OUTPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
$ipt -A OUTPUT -p udp --dport 53 -m state --state NEW,ESTABLISHED -j ACCEPT
$ipt -A OUTPUT -o lo -p all -j ACCEPT
$ipt -A OUTPUT -j DROP

$ipt -A FORWARD -m state --state ESTABLISHED,RELATED -j ACCEPT
$ipt -A FORWARD -p tcp -j TARPIT
$ipt -A FORWARD -j DROP

echo "Setting up fail2ban rules..."
echo "[ssh]" > /etc/fail2ban/jail.conf
echo "enabled = true" >> /etc/fail2ban/jail.conf
echo "port = ssh" >> /etc/fail2ban/jail.conf
echo "filter = sshd" >> /etc/fail2ban/jail.conf
echo "action = iptables-allports[name=SSH, protocol=tcp]" >> /etc/fail2ban/jail.conf
echo "logpath = /var/log/auth.log" >> /etc/fail2ban/jail.conf
echo "maxretry = 3" >> /etc/fail2ban/jail.conf
echo "bantime = 900" >> /etc/fail2ban/jail.conf

echo "[http-get-dos]" >> /etc/fail2ban/jail.conf
echo "enabled = true" >> /etc/fail2ban/jail.conf
echo "port = http,https,3000,3443" >> /etc/fail2ban/jail.conf
echo "filter = http-get-dos" >> /etc/fail2ban/jail.conf
echo "logpath = /home/gregoire/nginx_logs" >> /etc/fail2ban/jail.conf
echo "maxretry = 60" >> /etc/fail2ban/jail.conf
echo "findtime = 30" >> /etc/fail2ban/jail.conf
echo "action = iptables-tarpit[name=HTTP, protocol=tcp]" >> /etc/fail2ban/jail.conf
echo "mail-whois-lines[name=%(__name__)s, dest=%(destemail)s, logpath=%(logpath)s]" >> /etc/fail2ban/jail.conf
echo "bantime = 90" >> /etc/fail2ban/jail.conf

echo "[Definition]" > /etc/fail2ban/filter.d/http-get-dos.conf
echo "failregex = ^<HOST>.*\"" >> /etc/fail2ban/filter.d/http-get-dos.conf
echo "ignoreregex =" >> /etc/fail2ban/filter.d/http-get-dos.conf

cp -f $1/requirements/iptables-tarpit.conf /etc/fail2ban/action.d/

service fail2ban restart
fail2ban-client start