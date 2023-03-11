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
import { type HistoryHar, type HarRevision } from '../main/DataUtils';

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
  const [revisionId, setRevisionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Har | null>(null);
  const { filePath } = useParams();

  useEffect(() => {
    if (!filePath) {
      setData(null);
      return;
    }

    setLoading(true);
    IpcClient.getHarContent(filePath, revisionId)
      .then((newData) => {
        setData(newData);
      })
      .catch((error) => {
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filePath, revisionId]);

  if (!filePath) {
    return (
      <div>
        <Header />
        <h3>Missing File</h3>
      </div>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <FileNameAnchor value={filePath} />
        <h3>Loading...</h3>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Header />
        <FileNameAnchor value={filePath} />
        <RevisionSelector
          filePath={filePath}
          value={revisionId}
          onChange={setRevisionId}
        />
        <h3>Invalid data</h3>
      </>
    );
  }

  return (
    <>
      <Header />
      <FileNameAnchor value={filePath} />
      <RevisionSelector
        filePath={filePath}
        value={revisionId}
        onChange={setRevisionId}
      />
      <h3>Har Version: {data?.log.version}</h3>
      <h3>
        Creator:
        {data?.log.creator.name} (Version: {data?.log.creator.version})
      </h3>
      <div>
        <FlatNetworkDataGrid data={data} />
      </div>
    </>
  );
};

function FlatNetworkDataGrid(props: { data: Har }) {
  const { data } = props;
  const entries = data.log.entries;

  return (
    <div className="FlatNetworkDataGrid">
      <div className="FlatNetworkDataGrid__Header">
        <div>Resp Code</div>
        <div>Method</div>
        <div>URL</div>
        <div>Resp Type</div>
        <div>Resp Size</div>
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
        <ResponseStatusDescription code={responseCode} text={responseText} />
      </div>
      <div>
        <h3 style={{ fontWeight: 'bold' }}>{requestMethod}</h3>
      </div>
      <div>
        <a>{requestUrl}</a>
      </div>
      <div>{contentMimeType}</div>
      <div>{Math.round(contentSizeInBytes / 1000)} KB</div>
      <div>{new Date(time).toLocaleString()}</div>
      <div>{Math.floor(durationInMS)} ms</div>
      <div>
        <ConnectionContentDetails entry={entry} />
      </div>
    </div>
  );
}

function ConnectionContentDetails(props: { entry: Entry }) {
  const [show, setShow] = useState(false);
  const { entry } = props;
  const content = entry.response.content.text;
  const contentMimeType = entry.response.content.mimeType;

  if (show) {
    if (
      contentMimeType.includes('application/json') ||
      contentMimeType.includes('application/xml')
    ) {
      try {
        return <pre>{JSON.stringify(JSON.parse(content), null, 2)}</pre>;
      } catch (err) {
        return <pre>{content}</pre>;
      }
    }
    if (contentMimeType.includes('text/')) return <>{content}</>;
    if (contentMimeType.includes('image/'))
      return (
        <img
          src={`data:${contentMimeType};base64,${content}`}
          alt="Image File"
        />
      );

    return <>{content}</>;
  }

  return <button onClick={() => setShow(true)}>Show Content</button>;
}

export function HarBrowser() {
  return (
    <>
      <Header />
      <h3>Select a HAR file to investigate</h3>
      <div>
        <BrowseHarButton />
      </div>
      <h3>Recent HARS</h3>
      <div>
        <HistoricalHarList />
      </div>
      <div>
        <RevealDefaultStorageFolderButton />
      </div>
    </>
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

export function RevisionSelector(props: {
  filePath: string;
  value: string;
  onChange: (revisionId: string) => void;
}) {
  const [revisions, setRevisions] = useState<HarRevision[]>([]);
  const selectedRevisionId = props.value;

  useEffect(() => {
    IpcClient.getHarRevisions(props.filePath)
      .then((newRevisions) => setRevisions(newRevisions))
      .catch((err) => setRevisions([]));
  }, []);

  return (
    <div>
      <h3>RevisionID: </h3>
      <select
        value={selectedRevisionId}
        onChange={(e) => {
          // @ts-ignore
          props.onChange(e.currentTarget.value || '');
        }}
      >
        {revisions.map((revision) => (
          <option key={revision.revisionId} value={revision.revisionId}>
            {revision.revisionId}
          </option>
        ))}
        <option value="">Latest Data</option>
      </select>
    </div>
  );
}

export function RevealDefaultStorageFolderButton() {
  return (
    <a
      onClick={() => IpcClient.revealDefaultStorageFolder()}
      style={{ cursor: 'pointer' }}
      title="Reveal the folder where the default storage used for persistence located"
    >
      Reveal Default Storage Folder
    </a>
  );
}

export function FileNameAnchor(props: { value: string }) {
  const { value } = props;

  return (
    <h3>
      <span style={{ marginRight: '0.5rem' }}>File:</span>
      <a
        onClick={() => IpcClient.revealFolder(value)}
        style={{ cursor: 'pointer' }}
        title="Reveal the folder where this HAR file is located"
      >
        {value}
      </a>
    </h3>
  );
}

export function ResponseStatusDescription(props: {
  code: number;
  text: string;
}) {
  const responseCode = props.code;
  const responseText = props.text;

  let color = 'grey';
  if (responseCode >= 200 && responseCode <= 399) {
    color = 'green';
  } else if (responseCode >= 400) {
    color = 'red';
  }

  return (
    <>
      <h3 style={{ color, fontWeight: 'bold' }}>{responseCode}</h3>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HarBrowser />} />
        <Route path="/network-details/:filePath" element={<NetworkDetails />} />
      </Routes>
    </Router>
  );
}
