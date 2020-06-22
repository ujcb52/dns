from flask import session
from collections import OrderedDict
import ujson
import re
#import shutil
import os
import time
import subprocess

class Cdn():

    ZONE_DIR = '/app/named/var/'
    TEMP_DIR = '/app/named/var/swap/'
    SCRIPT_DIR = '/app/flask/dns//scripts/'
    Named_CONF = '/app/flask/dns/conf/cdn_named_list'
    R53_CONF = '/app/flask/dns/conf/cdn_route53_list'
    LOG_FILE = '/app/flask/dns/logs/Named.log'

    def Run(self, data):
        action = data['action']
        if action == 'checkcdnconfig':
            ret = OrderedDict()
            r53_fqdn = []
            try:
                with open(self.Named_CONF, 'r') as na_list:
                    named_list = na_list.read().split('\n')
            except:
                named_list = ['ERROR - Can not find cdn_named_list file!']

            for line in named_list:
                if line.strip() == '':
                    continue
                fqdn = line.split()[0]
                try:
                    record = self.checkRecordExist(fqdn)
                except:
                    record = ['ERROR - Can not find base domain zone file!']

#                dig = self.dig(fqdn)
#                ret[fqdn] = dict(record=record, dig=dig)
                ret[fqdn] = dict(record=record, dns="named")
            try:
                with open(self.R53_CONF, 'r') as r53_list:
                    route53_list = r53_list.read().split('\n')
            except:
                route53_list = ['ERROR - Can not find cdn_route53_list file!']

            for line in route53_list:
                if line.strip() == '':
                    continue
                r53_fqdn.append(line.split()[0])
            try:
                records = self.checkRoute53Record(r53_fqdn)
            except:
                records = ['ERROR - Can not find Route53 hostedzone!']

            if len(r53_fqdn) != len(records):
                for cnt in range(len(r53_fqdn)):
                    ret[r53_fqdn[cnt]] = dict(record=records, dns="route53")
            else:
                for cnt in range(len(r53_fqdn)):
                    ret[r53_fqdn[cnt]] = dict(record=records[cnt], dns="route53")
            return ret
        elif action == "setchangeRecords":
            runResult = self.scriptRun(self.SCRIPT_DIR+"test.sh")
            return runResult
        elif action == "setreturnRecords":
            return

    def scriptRun(self, scripts):
        cmd = ["/bin/sh", "%s" % scripts]
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, stdin=subprocess.PIPE, bufsize=-1)
        out,err = p.communicate()

        if err:
            raise Exception('Error: ' + str(err))
#        print(out)
#        return ujson.loads(out)
        return out

    def getHostedZones(self, domain=''):
        self.writeLog('INFO', 'getHostedZones - ' + domain)
        import boto3
        from botocore.config import Config
        client = boto3.client('route53',
                  aws_access_key_id='',
			      aws_secret_access_key='',
#			      config=Config(proxies={'http': '10.10.100.201:33128', 'https': '10.10.100.201:33128'}))
                  )
        list_hostedzones = client.list_hosted_zones()['HostedZones']
        for hostedzone in list_hostedzones:
            if hostedzone['Name'] == domain:
		list_resource = client.list_resource_record_sets(HostedZoneId=hostedzone['Id'])['ResourceRecordSets']
	return list_resource

    def checkRoute53Record(self, r53_fqdn):
        self.writeLog('INFO', 'checkRoute53Record - ' + str(r53_fqdn))
        ret = []
        list_resources = self.getHostedZones()
        for fqdn in r53_fqdn:
            for resource in list_resources:
                if resource['Name'] == fqdn:
		    try:
                        if resource['Weight'] == 100:
			    ret.append(["CNAME : "+ resource['ResourceRecords'][0]['Value'] + "\t\t"+"Record Weight : "+str(resource['Weight'])])
			else:
			    continue
                    except:
                        if 'TrafficPolicyInstanceId' in resource.keys():
                            ret.append(["TrafficPolicy. Not yet Support"])
                        else:
                            ret.append([resource['ResourceRecords'][0]['Value']])
        return ret

    def getBaseDomain(self, fqdn):
        self.writeLog('INFO', 'getBaseDomain - ' + fqdn)
        words = fqdn.split('.')
        c = len(words)
        for i in range(c):
            base = '.'.join(words[i:])
            zoneFile = self.getZoneFileName(base)
            if os.path.exists(zoneFile):
                return base
        err = 'Can Not Find Zone File : ' + fqdn
        self.writeLog('ERROR', err)
        raise Exception(err)

    def getHostname(self, fqdn):
        self.writeLog('INFO', 'getHostname - ' + fqdn)
        baseDomain = self.getBaseDomain(fqdn)
        if baseDomain == fqdn:
            return ''
        hostname = fqdn.replace('.' + baseDomain, '')
        return hostname

    def getZoneFileName(self, basedomain):
        self.writeLog('INFO', 'getZoneFileName - ' + basedomain)
        ZoneFileName = self.ZONE_DIR + basedomain + 'zone'
        return ZoneFileName

    def checkRecordExist(self, fqdn):
        self.writeLog('INFO', 'checkRecordExist - ' + fqdn)
        domain = self.getBaseDomain(fqdn)
        host = self.getHostname(fqdn)
        host = host.replace('.', '\.')
        zonefile = self.getZoneFileName(domain)
        with open(zonefile) as f:
            a = f.readlines()
            ret = []
            for line in a:
                if re.match(host + '\s+(\d+\s+)?(IN\s+)?A\s+.+', line):
                    ret.append(line)
		elif re.match(host + '\s+(\d+\s+)?(IN\s+)?CNAME\s+.+', line):
		    ret.append(line)
            return ret

    def writeLog(self, level, text):
#        user = session['uid']
        user = '1101167'
        logfile = self.LOG_FILE
        now = time.strftime('%F %T')
        with open(logfile, 'a') as f:
                log = '%s [%s] [%s] %s\n' % (now, user, level, text.strip())
                f.write(log)

