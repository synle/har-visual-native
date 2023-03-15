import CssBaseline from '@mui/material/CssBaseline';
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
import DataTable from './DataTable';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import NativeSelect from '@mui/material/NativeSelect';
import FilledInput from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import WifiIcon from '@mui/icons-material/Wifi';

import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Typography from '@mui/material/Typography';
import Toolbar from '@mui/material/Toolbar';
import CircularProgress from '@mui/material/CircularProgress';


function Header() {
  const navigate = useNavigate();
  return (
    <AppBar position="static" sx={{ p: 2 }}>
      <Box>
        <Typography
          variant="h5"
          component="div"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Har-Visual-Native
        </Typography>
      </Box>
    </AppBar>
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
      <AppContent>
        <h3>Missing File</h3>
      </AppContent>
    );
  }

  if (loading) {
    return (
      <AppContent>
        <FileNameAnchor value={filePath} />
        <Box>
          <CircularProgress />
        </Box>
      </AppContent>
    );
  }

  if (!data) {
    return (
      <AppContent>
        <FileNameAnchor value={filePath} />
        <RevisionSelector
          filePath={filePath}
          value={revisionId}
          onChange={setRevisionId}
        />
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          Invalid Data because the file <strong>{filePath}</strong> is either
          not present or corrupted JSON.
        </Alert>
      </AppContent>
    );
  }

  return (
    <AppContent>
      <FileNameAnchor value={filePath} />
      <RevisionSelector
        filePath={filePath}
        value={revisionId}
        onChange={setRevisionId}
      />
      <FilledInput
        label="Har Version"
        variant="outlined"
        value={data?.log.version}
      />
      <FilledInput
        label="Creator"
        variant="outlined"
        value={`${data?.log.creator.name} (Version: ${data?.log.creator.version})`}
      />
      <div>
        <FlatNetworkDataGrid data={data} />
      </div>
    </AppContent>
  );
};

function FlatNetworkDataGrid(props: { data: Har }) {
  const { data } = props;
  const entries = data?.log?.entries;

  const columns = [
    {
      Header: 'Method',
      accessor: (entry: Entry) => entry.request.method,
    },
    {
      Header: 'URL',
      accessor: (entry: Entry) => entry.request.url,
      Cell: (data: any, a, b, c) => {
        return (
          <Box
            sx={{
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-all',
            }}
          >
            {data.value}
          </Box>
        );
      },
    },
    {
      Header: 'RespCode',
      accessor: (entry: Entry) => entry.response.status,
    },
    {
      Header: 'RespText',
      accessor: (entry: Entry) => entry.response.statusText || 'N/A',
    },
    {
      Header: 'MIMEType',
      accessor: (entry: Entry) => entry.response.content.mimeType,
    },
    {
      Header: 'Size',
      accessor: (entry: Entry) =>
        `${(entry.response.content.size / 1024).toFixed(2)} KB`,
    },
    {
      Header: 'StartTime',
      accessor: (entry: Entry) => new Date(entry.startedDateTime).getTime(),
      Cell: (data: any, a, b, c) => {
        return new Date(data.value).toLocaleString();
      },
    },
    {
      Header: 'Duration',
      accessor: (entry: Entry) => `${Math.round(entry.time)} ms`,
    },
    {
      Header: 'Content',
      accessor: 'entry.response.content.text',
      disableFilters: true,
      Cell: (data: any, a, b, c) => {
        return <ConnectionContentDetails entry={data.row.original} />;
      },
    },
  ];

  return <DataTable data={entries} columns={columns} />;
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

  return (
    <Button color="info" variant="outlined" onClick={() => setShow(true)}>
      Show Content
    </Button>
  );
}

export function AppContent(props: {
  children: undefined | null | JSX.Element | JSX.Element[];
}) {
  const { children } = props;
  return (
    <>
      <Header />
      <Stack sx={{ px: 2 }} spacing={3}>
        {children}
      </Stack>
    </>
  );
}

export function HarBrowser() {
  return (
    <AppContent>
      <Paper sx={{ px: 2, py: 1 }} elevation={3}>
        <Typography gutterBottom variant="h6" component="div">
          Select a HAR file to investigate
        </Typography>
        <Box>
          <BrowseHarButton />
        </Box>
      </Paper>
      <Paper sx={{ px: 2, py: 1 }} elevation={3}>
        <Typography gutterBottom variant="h6" component="div">
          Recent HAR's
        </Typography>
        <HistoricalHarList />
      </Paper>
      <div>
        <RevealDefaultStorageFolderButton />
      </div>
    </AppContent>
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

  return (
    <Button onClick={onOpenHar} variant="contained">
      Browse for a HAR file
    </Button>
  );
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
    <List sx={{ width: '100%' }}>
      {historicalHars.map((historicalHar) => {
        return (
          <ListItem
            key={historicalHar.id}
            onClick={() => onOpenHar(historicalHar.filePath)}
            disablePadding
          >
            <ListItemIcon sx={{ minWidth: 'auto' }}>
              <WifiIcon />
            </ListItemIcon>
            <ListItemButton>
              <ListItemText primary={historicalHar.filePath} />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
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

  const DEFAULT_EMPTY_VALUE = 'latest';

  return (
    <FormControl fullWidth variant="outlined">
      <InputLabel variant="outlined" htmlFor="har-revision-select">
        HAR Revision
      </InputLabel>
      <NativeSelect
        input={<OutlinedInput label="HAR Revision" />}
        inputProps={{
          id: 'har-revision-select',
        }}
        value={selectedRevisionId || DEFAULT_EMPTY_VALUE}
        onChange={(e) => {
          // @ts-ignore
          let value = e.currentTarget.value || '';

          if (value === DEFAULT_EMPTY_VALUE) {
            value = '';
          }

          props.onChange(value);
        }}
      >
        {revisions.map((revision) => (
          <option key={revision.revisionId} value={revision.revisionId}>
            {revision.revisionId}
          </option>
        ))}
        <option value="latest">Latest Data</option>
      </NativeSelect>
    </FormControl>
  );
}

export function RevealDefaultStorageFolderButton() {
  return (
    <Button
      onClick={() => IpcClient.revealDefaultStorageFolder()}
      style={{ cursor: 'pointer' }}
      title="Reveal the folder where the default storage used for persistence located"
      variant="outlined"
    >
      Reveal Default Storage Folder
    </Button>
  );
}

export function FileNameAnchor(props: { value: string }) {
  const { value } = props;

  return <FilledInput label="File Path" variant="outlined" value={value} />;
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
    <>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<HarBrowser />} />
          <Route
            path="/network-details/:filePath"
            element={<NetworkDetails />}
          />
        </Routes>
      </Router>
    </>
  );
}
