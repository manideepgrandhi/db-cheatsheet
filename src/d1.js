/* Engines: pg=Aurora PostgreSQL, ms=SQL Server, mg=MongoDB (mongosh), ml=MarkLogic.
   Entry: {c:code, n:note, v:version, d:destructive, l:lang} or {na:note}. */
var NA=function(n){return {na:n}};
var TASKS=[
/* ===== Sessions & locks ===== */
{id:'active-sessions',cat:'sessions',tri:1,t:'List active sessions / running requests',k:'who is connected current activity processes running queries what is running now sp_who',
pg:{c:"SELECT pid, usename, datname, client_addr, state,\n       wait_event_type, wait_event,\n       now() - query_start AS runtime,\n       left(query, 100) AS query\nFROM pg_stat_activity\nWHERE state <> 'idle'\n  AND pid <> pg_backend_pid()\nORDER BY runtime DESC NULLS LAST;",n:'Without pg_monitor / pg_read_all_stats (or rds_superuser on Aurora) you only see query text for your own sessions.'},
ms:{c:"SELECT s.session_id, s.login_name, s.host_name,\n       DB_NAME(r.database_id) AS db, r.status, r.command,\n       r.wait_type, r.blocking_session_id,\n       r.total_elapsed_time / 1000 AS elapsed_s,\n       t.text AS sql_text\nFROM sys.dm_exec_requests r\nJOIN sys.dm_exec_sessions s ON s.session_id = r.session_id\nCROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t\nWHERE s.is_user_process = 1\n  AND r.session_id <> @@SPID\nORDER BY r.total_elapsed_time DESC;",n:'Needs VIEW SERVER STATE (VIEW SERVER PERFORMANCE STATE on 2022+) to see other sessions.'},
mg:{c:"db.currentOp({ active: true })",n:'Needs the inprog privilege (e.g. clusterMonitor role) to see other users\' operations. Aggregation form: db.getSiblingDB("admin").aggregate([{ $currentOp: {} }])'},
ml:{c:"xquery version \"1.0-ml\";\nfor $host in xdmp:hosts()\nfor $server in xdmp:servers()\nreturn xdmp:server-status($host, $server)//*:request-status",n:'XQuery (Query Console). REST alternative: curl --anyauth -u {admin} "http://{host}:8002/manage/v2/requests?format=json"'}},

{id:'session-count',cat:'sessions',tri:1,t:'Connection count vs max connections',k:'connections limit max_connections too many clients pool exhausted count sessions',
pg:{c:"SELECT count(*) AS used,\n       current_setting('max_connections')::int AS max_conn,\n       count(*) FILTER (WHERE state = 'active') AS active,\n       count(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_txn\nFROM pg_stat_activity;",n:'Aurora derives max_connections from instance memory by default (parameter group formula). Count includes background processes on PG10+.'},
ms:{c:"SELECT COUNT(*) AS user_sessions,\n       @@MAX_CONNECTIONS AS max_connections\nFROM sys.dm_exec_sessions\nWHERE is_user_process = 1;",n:'@@MAX_CONNECTIONS is the allowed maximum (32767 unless \'user connections\' is set).'},
mg:{c:"db.serverStatus().connections",n:'Shows current, available and totalCreated.'},
ml:{c:"xquery version \"1.0-ml\";\nfor $server in xdmp:servers()\nreturn fn:concat(xdmp:server-name($server), \": \",\n  fn:count(xdmp:server-status(xdmp:host(), $server)//*:request-status))",n:'XQuery. MarkLogic limits concurrency by app server threads, not a global connection cap.'}},

{id:'sessions-by-user',cat:'sessions',t:'Sessions grouped by user / database / host',k:'connections per user per db per host client breakdown sp_who2',
pg:{c:"SELECT usename, datname, client_addr, state, count(*)\nFROM pg_stat_activity\nGROUP BY 1, 2, 3, 4\nORDER BY 5 DESC;"},
ms:{c:"SELECT login_name, host_name, DB_NAME(database_id) AS db,\n       status, COUNT(*) AS sessions\nFROM sys.dm_exec_sessions\nWHERE is_user_process = 1\nGROUP BY login_name, host_name, database_id, status\nORDER BY sessions DESC;\n\n-- classic view:\nEXEC sp_who2;",v:'database_id column: SQL Server 2012+'},
mg:{c:"db.getSiblingDB(\"admin\").aggregate([\n  { $currentOp: { allUsers: true, idleConnections: true } },\n  { $group: { _id: { client: \"$client\", app: \"$appName\" }, count: { $sum: 1 } } },\n  { $sort: { count: -1 } }\n])"},
ml:NA('Requests are tracked per app server, not per user session. "List active sessions" shows the user for each request.')},

{id:'blocking',cat:'sessions',tri:1,t:'Find blocking / blocked sessions',k:'blocking blocked blocker lock wait waiting locks contention stuck hung',
pg:{c:"SELECT pid,\n       pg_blocking_pids(pid) AS blocked_by,\n       usename, wait_event_type, wait_event,\n       now() - query_start AS waiting_for,\n       left(query, 100) AS query\nFROM pg_stat_activity\nWHERE cardinality(pg_blocking_pids(pid)) > 0\nORDER BY waiting_for DESC;",v:'PostgreSQL 9.6+',n:'pg_blocking_pids() is fairly expensive; avoid polling it every second on a busy server.'},
ms:{c:"SELECT r.session_id, r.blocking_session_id,\n       r.wait_type, r.wait_time / 1000 AS wait_s,\n       r.wait_resource, DB_NAME(r.database_id) AS db,\n       t.text AS sql_text\nFROM sys.dm_exec_requests r\nCROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t\nWHERE r.blocking_session_id <> 0\nORDER BY r.wait_time DESC;"},
mg:{c:"db.currentOp({ waitingForLock: true })",n:'WiredTiger uses document-level concurrency, so true lock waits are rare; look for long ops holding exclusive collection/database locks.'},
ml:NA('No blocking-session view. Updates take document locks; look for long-running update requests (List active sessions) and lock metrics in Monitoring History.')},

{id:'head-blocker',cat:'sessions',tri:1,t:'Find the head (root) blocker',k:'head blocker root blocker lead blocking chain',
pg:{c:"SELECT pid, usename, state,\n       now() - xact_start AS xact_age,\n       left(query, 100) AS last_query\nFROM pg_stat_activity\nWHERE pid IN (SELECT unnest(pg_blocking_pids(pid)) FROM pg_stat_activity)\n  AND cardinality(pg_blocking_pids(pid)) = 0;",v:'PostgreSQL 9.6+',n:'The head blocker is often "idle in transaction": the app opened a transaction and never committed.'},
ms:{c:"SELECT s.session_id, s.login_name, s.host_name, s.program_name,\n       s.status, t.text AS last_sql\nFROM sys.dm_exec_sessions s\nJOIN sys.dm_exec_connections c ON c.session_id = s.session_id\nCROSS APPLY sys.dm_exec_sql_text(c.most_recent_sql_handle) t\nWHERE s.session_id IN (SELECT blocking_session_id FROM sys.dm_exec_requests WHERE blocking_session_id <> 0)\n  AND s.session_id NOT IN (SELECT session_id FROM sys.dm_exec_requests WHERE blocking_session_id <> 0);",n:'Uses most_recent_sql_handle so it also works when the head blocker is sleeping with an open transaction.'},
mg:NA('No blocking chains. Use db.currentOp({ waitingForLock: true }) and look at ops with large secs_running.'),
ml:NA('No equivalent; find the oldest running update request instead.')},

{id:'lock-detail',cat:'sessions',t:'Show lock details',k:'locks held lock mode granted pg_locks dm_tran_locks lock info',
pg:{c:"SELECT l.locktype, l.relation::regclass AS relation, l.mode, l.granted,\n       a.pid, a.usename, left(a.query, 80) AS query\nFROM pg_locks l\nJOIN pg_stat_activity a ON a.pid = l.pid\nWHERE a.datname = current_database()\nORDER BY l.granted, a.pid;"},
ms:{c:"SELECT request_session_id, resource_type,\n       DB_NAME(resource_database_id) AS db,\n       resource_associated_entity_id,\n       request_mode, request_status\nFROM sys.dm_tran_locks\nWHERE resource_database_id = DB_ID(N'{db}')\nORDER BY request_status, request_session_id;"},
mg:{c:"db.adminCommand({ lockInfo: 1 })",n:'Locks currently held or pending on this mongod. Cumulative counters: db.serverStatus().locks'},
ml:NA('Document lock state is not exposed as a queryable table.')},

{id:'idle-in-txn',cat:'sessions',tri:1,t:'Sessions idle in an open transaction',k:'idle in transaction open transaction sleeping uncommitted forgot commit',
pg:{c:"SELECT pid, usename, client_addr,\n       now() - xact_start AS xact_age,\n       now() - state_change AS idle_for,\n       left(query, 100) AS last_query\nFROM pg_stat_activity\nWHERE state IN ('idle in transaction', 'idle in transaction (aborted)')\nORDER BY xact_age DESC;",n:'idle_in_transaction_session_timeout (9.6+) in the parameter group terminates these automatically.'},
ms:{c:"SELECT s.session_id, s.login_name, s.host_name, s.program_name,\n       at.transaction_begin_time\nFROM sys.dm_tran_session_transactions st\nJOIN sys.dm_exec_sessions s ON s.session_id = st.session_id\nJOIN sys.dm_tran_active_transactions at ON at.transaction_id = st.transaction_id\nWHERE s.status = 'sleeping'\nORDER BY at.transaction_begin_time;"},
mg:{c:"db.currentOp({ active: false, transaction: { $exists: true } })",v:'MongoDB 4.0+ (multi-document transactions)',n:'transactionLifetimeLimitSeconds (default 60) aborts these automatically.'},
ml:NA('Multi-statement transactions time out per app server settings; there is no idle-transaction view.')},

{id:'oldest-txn',cat:'sessions',t:'Oldest open transaction',k:'longest transaction old transaction opentran open tran',
pg:{c:"SELECT pid, usename, state,\n       now() - xact_start AS xact_age,\n       backend_xmin,\n       left(query, 80) AS query\nFROM pg_stat_activity\nWHERE xact_start IS NOT NULL\nORDER BY xact_start\nLIMIT 5;",n:'An old backend_xmin holds back vacuum cleanup (bloat).'},
ms:{c:"DBCC OPENTRAN (N'{db}');"},
mg:{c:"db.currentOp({ transaction: { $exists: true } })",v:'MongoDB 4.0+',n:'Check transaction.timeOpenMicros in the output.'},
ml:NA('No equivalent.')},

{id:'deadlocks',cat:'sessions',t:'Check recent deadlocks',k:'deadlock deadlocks victim xml_deadlock_report',
pg:{c:"SELECT datname, deadlocks\nFROM pg_stat_database\nWHERE datname IS NOT NULL\nORDER BY deadlocks DESC;",n:'Counters only. Details go to the PostgreSQL log; log_lock_waits = on also logs long lock waits.'},
ms:{c:"SELECT xed.value('@timestamp', 'datetime2') AS ts_utc,\n       xed.query('.') AS deadlock_graph\nFROM (\n  SELECT CAST(st.target_data AS xml) AS target_data\n  FROM sys.dm_xe_session_targets st\n  JOIN sys.dm_xe_sessions s ON s.address = st.event_session_address\n  WHERE s.name = 'system_health' AND st.target_name = 'ring_buffer'\n) AS x\nCROSS APPLY x.target_data.nodes('RingBufferTarget/event[@name=\"xml_deadlock_report\"]') AS q(xed)\nORDER BY ts_utc DESC;",n:'Reads the built-in system_health ring buffer; older events roll off. Its event_file target keeps more history.'},
mg:NA('No classic deadlocks; WiredTiger write conflicts are retried internally (serverStatus().metrics.operation.writeConflicts).'),
ml:NA('MarkLogic detects deadlocks and retries the update automatically; they show in ErrorLog.txt.')},

{id:'cancel-query',cat:'sessions',t:'Cancel a running query (keep the session)',k:'cancel stop query abort statement interrupt',
pg:{c:"SELECT pg_cancel_backend({pid});",n:'Gentler than terminate: the query stops, the connection stays. On Aurora rds_superuser can cancel others\' sessions (not rdsadmin\'s).'},
ms:NA('KILL is the only server-side option and ends the whole session (rolling back its transaction). Client drivers can cancel their own query.'),
mg:{c:"db.killOp({opid})",d:1,n:'Get opid from db.currentOp(). Kills the operation, not the connection.'},
ml:{c:"xquery version \"1.0-ml\";\nxdmp:request-cancel(xdmp:host(), xdmp:server(\"{appserver}\"), {request_id})",d:1,n:'XQuery. request-id comes from xdmp:server-status(...)//*:request-status.'}},

{id:'kill-session',cat:'sessions',tri:1,danger:1,t:'Kill / terminate a session',k:'kill terminate session end connection kill spid kill pid disconnect',
pg:{c:"SELECT pg_terminate_backend({pid});",d:1,n:'Needs superuser, the same role, or pg_signal_backend. On Aurora rds_superuser can terminate other users\' sessions but not rdsadmin\'s.'},
ms:{c:"KILL {spid};\n\n-- check rollback progress afterwards:\nKILL {spid} WITH STATUSONLY;",d:1,n:'Rolls back the open transaction, which can take as long as the work done so far.'},
mg:{c:"db.killOp({opid})",d:1,n:'Operation-level kill. For every op of a user see "Kill all sessions for a database / user".'},
ml:{c:"xquery version \"1.0-ml\";\nxdmp:request-cancel(xdmp:host(), xdmp:server(\"{appserver}\"), {request_id})",d:1,n:'XQuery. Cancels a request on that app server.'}},

{id:'kill-all-db',cat:'sessions',danger:1,t:'Kill all sessions for a database / user',k:'kill all sessions disconnect everyone single user mode terminate all connections',
pg:{c:"SELECT pg_terminate_backend(pid)\nFROM pg_stat_activity\nWHERE datname = '{db}'\n  AND pid <> pg_backend_pid();",d:1,n:'Clients may reconnect immediately; revoke CONNECT first if you need them out.'},
ms:{c:"ALTER DATABASE [{db}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;\n\n-- when done:\nALTER DATABASE [{db}] SET MULTI_USER;",d:1,n:'Rolls back all open transactions in that database immediately.'},
mg:{c:"db.adminCommand({\n  killAllSessionsByPattern: [\n    { users: [ { user: \"{user}\", db: \"{authdb}\" } ] }\n  ]\n})",d:1,v:'MongoDB 3.6+',n:'Kills that user\'s sessions and their operations.'},
ml:NA('No bulk kill. Cancel requests one by one with xdmp:request-cancel, or disable the app server temporarily.')},
