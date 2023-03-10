import { Har, Entry } from 'har-format';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams,
} from 'react-router-dom';
import 'renderer/App.scss';

import { useEffect, useState } from 'react';
import * as IpcClient from './IpcClient';
import { type HistoryHar } from '../main/DataUtils';

function Header() {
  const navigate = useNavigate();
  return (
    <h1>
      <a onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        HAR-VISUAL-NATIVE
      </a>
    </h1>
  );
}

const NetworkDetails = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Har | null>(null);
  const { fileName } = useParams();

  useEffect(() => {
    setLoading(true);
    IpcClient.getHarContent(fileName)
      .then((newData) => {
        setData(newData);
      })
      .catch((error) => {
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fileName]);

  if (!fileName) {
    return (
      <div>
        <Header />
        <h3>Missing File</h3>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <Header />
        <h2>File: {fileName}</h2>
        <h3>Loading...</h3>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <Header />
        <h2>File: {fileName}</h2>
        <h3>Invalid data</h3>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <h2>File: {fileName}</h2>
      <h3>Har Version: {data?.log.version}</h3>
      <h3>
        Creator:
        {data?.log.creator.name} (Version: {data?.log.creator.version})
      </h3>
      <div>
        <FlatNetworkDataGrid data={data} />
      </div>
    </div>
  );
};

function FlatNetworkDataGrid(props: { data: Har }) {
  const { data } = props;
  const entries = data.log.entries;

  return (
    <div className="FlatNetworkDataGrid">
      <div className="FlatNetworkDataGrid__Header">
        <div>URL</div>
        <div>Method</div>
        <div>Response Code</div>
        <div>Content Type</div>
        <div>MimeType</div>
        <div>Time</div>
        <div>Duration</div>
        <div>Content</div>
      </div>
      {entries.map((entry) => (
        <ConnectionEntryRow
          entry={entry}
          key={`${entry.connection}.${entry.request.url}.${entry.startedDateTime}`}
        />
      ))}
    </div>
  );
}

function ConnectionEntryRow(props: { entry: Entry }) {
  const { entry } = props;
  const requestUrl = entry.request.url;
  const requestMethod = entry.request.method;
  const responseCode = entry.response.status;
  const responseText = entry.response.statusText;
  const contentMimeType = entry.response.content.mimeType;
  const contentSizeInBytes = entry.response.content.size;
  const time = entry.startedDateTime;
  const durationInMS = entry.time;

  return (
    <div className="FlatNetworkDataGrid__Row">
      <div>
        <a>{requestUrl}</a>
      </div>
      <div>{requestMethod}</div>
      <div>
        {responseCode} {responseText ? <code>{responseText}</code> : null}
      </div>
      <div>{contentMimeType}</div>
      <div>{Math.round(contentSizeInBytes / 1000)} KB</div>
      <div>{new Date(time).toLocaleString()}</div>
      <div>{Math.floor(durationInMS)} ms</div>
      <div style={{ textAlign: 'center' }}>
        <ConnectionContentDetails entry={entry} />
      </div>
    </div>
  );
}

function ConnectionContentDetails(props: { entry: Entry }) {
  const [show, setShow] = useState(false);
  const { entry } = props;
  const content = entry.response.content.text;

  if (show) {
    return content;
  }

  return <button onClick={() => setShow(true)}>Show Content</button>;
}

export function HarBrowser() {
  return (
    <div>
      <Header />
      <h3>Select a HAR file to investigate</h3>
      <div>
        <BrowseHarButton />
      </div>
      <h3>Recent HARS</h3>
      <div>
        <HistoricalHarList />
      </div>
    </div>
  );
}

export function BrowseHarButton() {
  const navigate = useNavigate();

  const onOpenHar = async () => {
    try {
      const filePaths = await IpcClient.browseHarFile();
      const filePath = filePaths[0];

      navigate(`/network-details/${encodeURIComponent(filePath)}`);
      await IpcClient.addHistoricalHar(filePath);
    } catch (err) {}
  };

  return <button onClick={onOpenHar}>Browse for a HAR file</button>;
}

export function HistoricalHarList() {
  const navigate = useNavigate();
  const [historicalHars, setHistoryHars] = useState<HistoryHar[]>([]);

  const onOpenHar = async (filePath: string) => {
    navigate(`/network-details/${encodeURIComponent(filePath)}`);

    try {
      await IpcClient.addHistoricalHar(filePath);

      await IpcClient.getHistoricalHars()
        .then((newHistoryHars) => setHistoryHars(newHistoryHars))
        .catch((err) => setHistoryHars([]));
    } catch (err) {}
  };

  useEffect(() => {
    IpcClient.getHistoricalHars()
      .then((newHistoryHars) => setHistoryHars(newHistoryHars))
      .catch((err) => setHistoryHars([]));
  }, []);

  if (!historicalHars || historicalHars.length === 0) {
    return <div>N/A</div>;
  }

  return (
    <ul>
      {historicalHars.map((historicalHar) => {
        return (
          <li key={historicalHar.id}>
            <a
              onClick={() => onOpenHar(historicalHar.filePath)}
              style={{ cursor: 'pointer' }}
            >
              {historicalHar.filePath}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function RevisionSelector(props:{
  onChange?: (revisionId: string) => void
}){
  const [revisionIds, setRevisionIds] = useState<string[]>([]);

  useEffect(() => {
    IpcClient.getHarRevisions()
      .then((newRevisionIds) => setRevisionIds(newRevisionIds))
      .catch((err) => setRevisionIds([]));
  }, []);

}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HarBrowser />} />
        <Route path="/network-details/:fileName" element={<NetworkDetails />} />
      </Routes>
    </Router>
  );
}
