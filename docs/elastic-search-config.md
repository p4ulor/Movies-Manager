- You can download [here](https://www.elastic.co/downloads/elasticsearch)
- Note: [Elastic Search and Kibana are opensource](https://github.com/elastic)
## Windows
- For windows a .zip file is downloaded, you can place it anywhere
- Inside the downloaded folder, you can create the following batch file as `run.bat`:
```
bin\elasticsearch.bat
```
- It will launch it and a CMD window will be open, it must remain open while you use elastic, once the setup is ready, and if there's enough disk space, you will be able to start acessing the DB with:
- http://localhost:9200/_cat

## Linux
- In the case of Linux, it's installed as a service, and by default it starts on boot, you might want to turn it off. Here's some helpful commands you might want to save as .sh bash scrips
```
systemctl start elasticsearch
systemctl status elasticsearch
systemctl stop elasticsearch.service
```

## Alternative for having elastic search
- Instead of installing it on your computer you can also run it as a Docker container

## Disabling security
- ES comes with a default security feature, for local applications this isn't needed and makes having an easy to connect database easier
- These settings are edited in `elasticsearch-8.5.3\config\elasticsearch.yml`
- Make sure the following fields are set:
```yml
ingest.geoip.downloader.enabled: false
transport.host: localhost
xpack.security.enabled: false
xpack.security.enrollment.enabled: false

xpack.security.http.ssl:
  enabled: false
  keystore.path: certs/http.p12

xpack.security.transport.ssl:
  enabled: false
  verification_mode: certificate
  keystore.path: certs/transport.p12
  truststore.path: certs/transport.p12

http.host: 0.0.0.0
```
[source1](https://stackoverflow.com/a/72626114/9375488), [source2](https://stackoverflow.com/a/44358409/9375488)

## Reducing RAM usage
- By default, elastic search uses half of your RAM when running
- This setting can be changed in `elasticsearch-8.5.3\config\jvm.options`
- Where the number before 'g' is the number of gigabytes being used. I think the lowest you can use if 2 GB
```bash
## -Xms4g
## -Xmx4g
```
## Consulting the DB w/ Kibana
- [Kibana](https://www.elastic.co/kibana), also developed by elastic, aids in doing in analytics and consult the Elastic Search DB
- [Good tutorial on how to use it](https://youtu.be/gfu_SWEsmv0)
- Useful tab in Kibana: http://localhost:5601/app/dev_tools#/console

[See also elastic search terminology here](https://www.elastic.co/guide/en/elastic-stack-glossary/current/terms.html#d-glos)
