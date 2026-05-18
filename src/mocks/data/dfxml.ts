export const MOCK_DFXML_FRAGMENTS: string[] = [
  `<dfxml version="1.2">
  <source>
    <image_filename>2023_KDFS.E01</image_filename>
    <image_size>53687091200</image_size>
    <hashdigest type="SHA-256">7c4a...f2e1</hashdigest>
  </source>
  <target>
    <path>Users/Admin/NTUSER.DAT</path>
    <plugin>registry.ntuser.userassist</plugin>
    <plugin>registry.ntuser.runmru</plugin>
  </target>
  <artifact type="userassist">
    <entry name="svchost32.exe" run_count="14"
           last_run="2023-09-15T02:31:44Z"/>
    <entry name="encrypt_tool.exe" run_count="3"
           last_run="2023-09-15T02:33:12Z"/>
  </artifact>
  <artifact type="runmru">
    <entry value="cmd /c svchost32.exe -encrypt"
           timestamp="2023-09-15T02:30:55Z"/>
  </artifact>
  <summary suspect_traces="3"/>
</dfxml>`,
  `<dfxml version="1.2">
  <source>
    <path>Windows/System32/winevt/Logs/Security.evtx</path>
    <filesize>71303168</filesize>
  </source>
  <filter>
    <event_id>4624</event_id>
    <event_id>4625</event_id>
  </filter>
  <eventlog source="Security.evtx">
    <event id="4625" ts="2023-09-14T23:12:07Z"
           logon_type="10" user="Admin"
           src_ip="192.168.1.105" status="failed"/>
    <event id="4624" ts="2023-09-15T02:28:33Z"
           logon_type="10" user="Admin"
           src_ip="192.168.1.105" status="success"/>
  </eventlog>
  <summary total="47" anomaly="8"/>
</dfxml>`,
  `<dfxml version="1.2">
  <source>
    <path>Windows/Prefetch/</path>
    <file_count>127</file_count>
  </source>
  <prefetch>
    <entry name="SVCHOST32.EXE-A1B2C3D4.pf"
           first_run="2023-09-15T02:31:44Z"
           last_run="2023-09-15T02:31:44Z"
           run_count="1"/>
    <entry name="ENCRYPT_TOOL.EXE-E5F6A7B8.pf"
           first_run="2023-09-15T02:33:12Z"
           last_run="2023-09-15T02:35:08Z"
           run_count="3"/>
  </prefetch>
  <summary suspect_executables="3"/>
</dfxml>`,
  `<dfxml version="1.2">
  <source>
    <path>$MFT</path>
    <record_count>48231</record_count>
  </source>
  <filter>
    <time_range start="2023-09-14T00:00:00Z"
                end="2023-09-16T00:00:00Z"/>
  </filter>
  <timeline>
    <event ts="2023-09-15T02:33:15Z" type="modify"
           file="Documents/report_2023.xlsx"
           ext_change=".xlsx → .xlsx.locked"/>
    <event ts="2023-09-15T02:33:18Z" type="create"
           file="Documents/README_DECRYPT.txt"/>
    <event ts="2023-09-15T02:35:22Z" type="modify"
           file="Pictures/family.jpg.locked"/>
  </timeline>
  <summary encryption_events="142" si_fn_mismatch="5"/>
</dfxml>`,
  `<dfxml version="1.2">
  <source>
    <vss_catalog>System Volume Information</vss_catalog>
  </source>
  <vss>
    <snapshot id="VSS-001"
              created="2023-09-10T04:00:00Z"
              status="available"/>
    <snapshot id="VSS-002"
              created="2023-09-13T04:00:00Z"
              status="available"/>
    <deleted_snapshot id="VSS-003"
              created="2023-09-14T04:00:00Z"
              deleted_at="2023-09-15T02:36:01Z"/>
    <delete_command>vssadmin delete shadows /all</delete_command>
  </vss>
  <summary available="2" deleted="3"/>
</dfxml>`,
  `<dfxml version="1.2">
  <source>
    <path>network_logs/</path>
    <firewall_log>pfirewall.log</firewall_log>
  </source>
  <network>
    <connection ts="2023-09-15T02:29:11Z"
                src="192.168.1.50" dst="45.33.32.156"
                port="443" proto="TCP"
                tag="c2_beacon"/>
    <connection ts="2023-09-15T02:36:44Z"
                src="192.168.1.50" dst="185.220.101.34"
                port="8443" bytes_out="524288"
                tag="exfiltration_suspect"/>
  </network>
  <summary c2_connections="12" exfil_candidates="4"/>
</dfxml>`,
  `<dfxml version="1.2">
  <source>
    <path>Windows/System32/Tasks/</path>
    <task_count>34</task_count>
  </source>
  <tasks>
    <task name="WindowsUpdateCheck"
          created="2023-09-15T02:34:00Z"
          trigger="DAILY 02:00"
          action="cmd /c C:\\Users\\Admin\\svchost32.exe"
          tag="malicious"/>
  </tasks>
  <summary total="34" malicious="1"/>
</dfxml>`,
  `<dfxml version="1.2">
  <source>
    <path>Users/Admin/AppData/Local/Google/Chrome/User Data/Default/History</path>
    <format>SQLite</format>
  </source>
  <browser type="Chrome">
    <visit url="https://free-tools-download.xyz/optimizer.zip"
           ts="2023-09-14T18:22:31Z"
           title="Free PC Optimizer"/>
    <download url="https://free-tools-download.xyz/optimizer.zip"
              ts="2023-09-14T18:22:45Z"
              path="Downloads/optimizer.zip"
              size="2458624"/>
  </browser>
  <summary total_visits="2341" suspect_downloads="1"/>
</dfxml>`,
  `<dfxml version="1.2">
  <source>
    <path>Users/Admin/AppData/Local/Microsoft/Outlook/admin@company.ost</path>
    <format>OST</format>
  </source>
  <email>
    <message ts="2023-09-14T16:30:00Z"
             from="hr-notice@company-portal.net"
             subject="연봉 조정 안내"
             tag="phishing"
             body_link="https://free-tools-download.xyz"/>
    <message ts="2023-09-14T17:45:12Z"
             from="support@ms-security-alert.com"
             subject="긴급: 보안 업데이트 필요"
             tag="phishing">
      <attachment name="security_patch.zip"
                  size="1048576"
                  sha256="b7e3...9d42"
                  tag="malicious"/>
    </message>
  </email>
  <summary phishing="2" malicious_attachments="1"/>
</dfxml>`,
  `<dfxml version="1.2">
  <source>
    <hive>SOFTWARE</hive>
    <key>Microsoft\\Windows\\CurrentVersion\\Uninstall</key>
  </source>
  <programs>
    <program name="PC Optimizer Pro"
             install_date="2023-09-14"
             publisher="Unknown"
             path="C:\\Program Files\\PCOptimizer\\"
             tag="suspect"/>
    <program name="svchost32"
             install_date="2023-09-15"
             publisher=""
             path="C:\\Users\\Admin\\"
             tag="malicious"/>
  </programs>
  <summary total="87" suspect="2"/>
</dfxml>`,
];
