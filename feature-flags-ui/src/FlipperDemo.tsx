import React, { useState, useEffect } from 'react';
import {Box,Card, CardContent,CardHeader,Typography,TextField,Button,Stack,Tabs,Tab, AppBar,Toolbar,Container,Chip,Alert,AlertTitle,Paper,CircularProgress, List, ListItem,ListItemText, FormGroup,FormLabel,InputAdornment,Switch, FormControlLabel, Avatar} from '@mui/material';
import {Settings,Visibility, People, BarChart,FlashOn,Security,Star,Palette,Search, Info} from '@mui/icons-material';
import { Features, DashboardData, ExperimentData, FeatureFlag, PercentageInput, ActorInput } from './types/flipper';


const FlipperDemo: React.FC = () => {
  const [features, setFeatures] = useState<Features>({});
  const [dashboardData, setDashboardData] = useState<DashboardData>({ features: {},userId    : '',userHash: 0 });
  const [experimentData, setExperimentData] = useState<ExperimentData>({});
  const [userId, setUserId] = useState<string>('user12');
  const [currentUserId, setCurrentUserId] = useState<string>('user12');
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [allFeatures, setAllFeatures] = useState<FeatureFlag[]>([]);

  const API_BASE: string = 'http://ec2-15-206-90-121.ap-south-1.compute.amazonaws.com:8080/api';

  useEffect(() => {
    loadUserData();
    fetchAllFeatures();
  }, []);

  const loadUserData = async (): Promise<void> => {
    await fetchDashboardData();
    await fetchExperimentData();
    setCurrentUserId(userId);
  };

  const handleSearch = async (): Promise<void> => {
    if (!userId.trim()) {
      alert('Please enter a valid User ID');
      return;
    }
    
    if (userId === currentUserId) {
      return;
    }

    console.log(`Loading data for user: ${userId}`);
    await loadUserData();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const fetchDashboardData = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log(`Fetching dashboard data for user: ${userId}`);
      
      const response = await fetch(`${API_BASE}/dashboard?userId=${userId}`);
      const data: DashboardData = await response.json();
      
      console.log('Dashboard API Response:', data);
      
      setDashboardData(data);
      setFeatures(data.features);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setFeatures({
        new_dashboard: false,
        beta_features: false,
        premium_content: false,
        dark_mode: false
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExperimentData = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/experiment?userId=${userId}`);
      const data: ExperimentData = await response.json();
      setExperimentData(data);
    } catch (error) {
      console.error('Error fetching experiment data:', error);
      setExperimentData({
        variant: 'control',
        welcomeMessage: 'Welcome to the standard experience!',
        buttonColor: '#3B82F6'
      });
    }
  };

  const fetchAllFeatures = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/flipper/features`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: FeatureFlag[] = await response.json();
      const validFeatures = Array.isArray(data) ? data.filter(feature => 
        feature && 
        typeof feature === 'object' && 
        typeof feature.name === 'string' && 
        feature.name.trim() !== ''
      ) : [];
      
      setAllFeatures(validFeatures);
    } catch (error) {
      console.error('Error fetching all features:', error);
      setAllFeatures([
        { name: 'new_dashboard', enabled: false, percentage: 0, actors: '' },
        { name: 'beta_features', enabled: false, percentage: 25, actors: 'user1,user2' },
        { name: 'premium_content', enabled: false, percentage: 50, actors: '' },
        { name: 'dark_mode', enabled: false, percentage: 75, actors: 'admin' },
        { name: 'experiment_a', enabled: false, percentage: 0, actors: '' },
        { name: 'experiment_b', enabled: false, percentage: 0, actors: '' }
      ]);
    }
  };

  const toggleFeature = async (featureName: string, enable: boolean): Promise<void> => {
    try {
      const endpoint = enable ? 'enable' : 'disable';
      console.log(`${enable ? 'Enabling' : 'Disabling'} feature: ${featureName}`);
      
      await fetch(`${API_BASE}/flipper/features/${featureName}/${endpoint}`, {
        method: 'POST'
      });
      
      await loadUserData();
      await fetchAllFeatures();
    } catch (error) {
      console.error(`Error ${enable ? 'enabling' : 'disabling'} feature:`, error);
    }
  };

  const setPercentageRollout = async (featureName: string, percentage: string): Promise<void> => {
    try {
      console.log(`Setting ${featureName} to ${percentage}% rollout`);
      
      await fetch(`${API_BASE}/flipper/features/${featureName}/percentage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ percentage: parseInt(percentage) })
      });
      
      await fetchAllFeatures();
      await loadUserData();
    } catch (error) {
      console.error('Error setting percentage rollout:', error);
    }
  };

  const addActor = async (featureName: string, actorId: string): Promise<void> => {
    try {
      console.log(`Adding actor ${actorId} to feature ${featureName}`);
      
      await fetch(`${API_BASE}/flipper/features/${featureName}/actors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ actorId })
      });
      
      await fetchAllFeatures();
      await loadUserData();
    } catch (error) {
      console.error('Error adding actor:', error);
    }
  };

  const enableFeatureForSpecificUsers = async (featureName: string, userIds: string[]): Promise<void> => {
    try {
      console.log(`Enabling ${featureName} for specific users:`, userIds);
      
      await fetch(`${API_BASE}/flipper/features/${featureName}/disable`, {
        method: 'POST'
      });
      
      await fetch(`${API_BASE}/flipper/features/${featureName}/percentage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ percentage: 0 })
      });
      
      for (const userId of userIds) {
        await fetch(`${API_BASE}/flipper/features/${featureName}/actors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ actorId: userId })
        });
      }
      
      await fetchAllFeatures();
      await loadUserData();
    } catch (error) {
      console.error('Error enabling feature for specific users:', error);
    }
  };

  // Dashboard Tab Component
  const DashboardTabContent = (): JSX.Element => (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Card elevation={3}>
        <CardHeader  avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><Visibility /></Avatar>} title={  <Typography variant="h5" component="h1"> Dashboard View</Typography> }  subheader={ <Typography variant="body2" color="text.secondary"> User: <strong>{currentUserId}</strong> | Hash: {dashboardData.userHash} </Typography> }/><CardContent>
          <Stack spacing={3} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Paper  elevation={2}  sx={{  p: 3,  flex: 1, backgroundColor: features.new_dashboard ? 'success.light' : 'grey.100', borderLeft: features.new_dashboard ? '4px solid' : '4px solid', borderColor: features.new_dashboard ? 'success.main' : 'grey.400',transition: 'all 0.3s ease' }}>
                <Typography variant="h6" gutterBottom color={features.new_dashboard ? 'success.dark' : 'text.primary'}>
                  Dashboard Version
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                  {dashboardData.dashboardVersion || (features.new_dashboard ? 'v2.0 (New)' : 'v1.0 (Legacy)')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Layout: {dashboardData.layout || (features.new_dashboard ? 'Modern Grid' : 'Classic')}
                </Typography>
              </Paper>
              
              <Paper  elevation={2}  sx={{  p: 3,  flex: 1,  backgroundColor: features.beta_features ? 'secondary.light' : 'grey.100',  borderLeft: features.beta_features ? '4px solid' : '4px solid',borderColor: features.beta_features ? 'secondary.main' : 'grey.400', transition: 'all 0.3s ease' }} >
                <Typography variant="h6" gutterBottom color={features.beta_features ? 'secondary.dark' : 'text.primary'}>
                  Beta Features </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                  {features.beta_features ? 'Enabled' : 'Disabled'}
                </Typography>
                {features.beta_features && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <Star sx={{ color: 'secondary.main', mr: 1 }} fontSize="small" />
                    <Typography variant="body2" sx={{ color: 'secondary.main' }}>
                      Advanced Analytics Available
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </Stack>

          <Paper  elevation={2} sx={{  p: 3,  backgroundColor: features.premium_content ? 'warning.light' : 'grey.100', borderLeft: features.premium_content ? '4px solid' : '4px solid', borderColor: features.premium_content ? 'warning.main' : 'grey.400', transition: 'all 0.3s ease'   }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Security sx={{ color: features.premium_content ? 'warning.dark' : 'grey.600', mr: 2 }} />
              <Typography variant="h6" color={features.premium_content ? 'warning.dark' : 'text.primary'}>
                Premium Content
              </Typography>
            </Box>
        <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}> {features.premium_content ? 'Unlocked' : 'Locked'} </Typography>
        {features.premium_content && ( <Typography variant="body2" sx={{ color: 'warning.dark' }}>  You have access to premium features! </Typography> )}
          </Paper>
        </CardContent>
      </Card>
    </Container>
  );

  // Experiment Tab Component
  const ExperimentTabContent = (): JSX.Element => (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Card elevation={3}>
        <CardHeader avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}><BarChart /></Avatar>}  title={<Typography variant="h5" component="h1">  A/B Testing Experiment</Typography>} subheader="Testing different user experiences to optimize performance"/>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
            <Paper  elevation={2} sx={{  p: 3,  flex: 1,minHeight: '150px',backgroundColor: experimentData.variant === 'control' ? 'primary.light' : 'grey.100', borderLeft: experimentData.variant === 'control' ? '4px solid' : '4px solid',borderColor: experimentData.variant === 'control' ? 'primary.main' : 'grey.400', position: 'relative', transition: 'all 0.3s ease'  }} >
              <Typography variant="h6" gutterBottom>Control Group</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Standard experience
              </Typography>
              {experimentData.variant === 'control' && ( <Chip  label="ACTIVE" color="primary"  size="small"  sx={{ position: 'absolute', top: 16, right: 16 }} />  )}
            </Paper>
            
            <Paper elevation={2}  sx={{  p: 3,  flex: 1,  minHeight: '150px', backgroundColor: experimentData.variant === 'variant_a' ? 'error.light' : 'grey.100', borderLeft: experimentData.variant === 'variant_a' ? '4px solid' : '4px solid', borderColor: experimentData.variant === 'variant_a' ? 'error.main' : 'grey.400', position: 'relative', transition: 'all 0.3s ease'}} >
              <Typography variant="h6" gutterBottom>Variant A</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}> Enhanced experience   </Typography>
              {experimentData.variant === 'variant_a' && (
                <Chip label="ACTIVE"  color="error" size="small"  sx={{ position: 'absolute', top: 16, right: 16 }} />)}
            </Paper>
            
            <Paper elevation={2}  sx={{  p: 3,  flex: 1, minHeight: '150px',  backgroundColor: experimentData.variant === 'variant_b' ? 'success.light' : 'grey.100', borderLeft: experimentData.variant === 'variant_b' ? '4px solid' : '4px solid',  borderColor: experimentData.variant === 'variant_b' ? 'success.main' : 'grey.400', position: 'relative',transition: 'all 0.3s ease'   }}>
              <Typography variant="h6" gutterBottom>Variant B</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}> Alternative experience  </Typography>
              {experimentData.variant === 'variant_b' && (
                <Chip  label="ACTIVE"  color="success"  size="small"  sx={{ position: 'absolute', top: 16, right: 16 }}  /> )}
            </Paper>
          </Box>

          <Paper elevation={2} sx={{ p: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Typography variant="h5" gutterBottom sx={{ color: 'white', mb: 3 }}> Your Current Experience</Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>Assigned Variant:</Typography>
                <Typography variant="h4" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                  {experimentData.variant || 'control'}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}> Welcome Message:</Typography>
                <Typography variant="h6" sx={{ fontStyle: 'italic' }}> "{experimentData.welcomeMessage || 'Welcome to the standard experience!'}"  </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
              <Palette sx={{ color: 'rgba(255,255,255,0.8)' }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Button Color:
              </Typography>
              <Box  sx={{  width: 40,  height: 40, backgroundColor: experimentData.buttonColor || '#3B82F6',  borderRadius: 1, border: '2px solid rgba(255,255,255,0.3)',  boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}  />
              <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.9)' }}>
                {experimentData.buttonColor || '#3B82F6'}
              </Typography>
            </Box>
          </Paper>
        </CardContent>
      </Card>
    </Container>
  );

  // Admin Tab Component
  const AdminTabContent = (): JSX.Element => {
    const [newFeatureName, setNewFeatureName] = useState<string>('');
    const [percentageInput, setPercentageInput] = useState<PercentageInput>({});
    const [actorInput, setActorInput] = useState<ActorInput>({});

    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Card elevation={3}>
          <CardHeader avatar={<Avatar sx={{ bgcolor: 'grey.600' }}><Settings /></Avatar>} title={ <Typography variant="h5" component="h1">  Feature Flag Administration  </Typography>   } subheader="Manage feature flags and experiments"/>
          <CardContent>
            {/* Quick Actions */}
            <Alert severity="info" sx={{ mb: 4 }}>
              <AlertTitle>Quick Actions</AlertTitle>
              <Typography variant="body2" sx={{ mb: 2 }}>Use these shortcuts to quickly set up common scenarios:</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button   variant="contained" color="primary" size="small" onClick={() => enableFeatureForSpecificUsers('new_dashboard', ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'])} > Enable New Dashboard for 10 Users  </Button>
                <Button  variant="contained"  color="success" size="small"onClick={() => enableFeatureForSpecificUsers('dark_mode', ['admin'])} > Enable Dark Mode for Admin Only</Button>
              </Box>
            </Alert>

            {/* Feature Management */}
            <Stack spacing={3}>
              {allFeatures.filter(feature => feature && feature.name).map((feature: FeatureFlag, index: number) => (
                <Paper key={feature.name || index} elevation={2} sx={{ overflow: 'hidden' }}>
                  <Box sx={{  p: 3,   background: feature.enabled  ? 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)'  : 'linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%)'}}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                        {feature.name ? feature.name.replace(/_/g, ' ') : 'Unknown Feature'}
                      </Typography>
                      <FormControlLabel   control={   <Switch checked={feature.enabled || false} onChange={() => feature.name && toggleFeature(feature.name, !feature.enabled)} color="primary" /> } label={<Chip  label={feature.enabled ? 'Enabled' : 'Disabled'}  color={feature.enabled ? 'success' : 'default'}  size="small"  /> } />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                      <Box sx={{ flex: 1 }}>
                        <FormGroup>
                          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>   Percentage Rollout </FormLabel>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField size="small" type="number" inputProps={{ min: 0, max: 100 }}  placeholder={feature.percentage?.toString() || "0"}  value={percentageInput[feature.name || ''] || ''}   onChange={(e) =>  feature.name && setPercentageInput({...percentageInput, [feature.name]: e.target.value}) } InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment>, }}   sx={{ flex: 1 }} variant="outlined" />
                            <Button variant="outlined"  color="primary"  disabled={!feature.name}onClick={() => { if (feature.name) { const percentage = percentageInput[feature.name] || feature.percentage?.toString() || "0"; setPercentageRollout(feature.name, percentage); setPercentageInput({...percentageInput, [feature.name]: ''});  } }}  > Set</Button>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}> Current: {feature.percentage || 0}%</Typography>
                        </FormGroup>
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <FormGroup>
                          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
                            Add Specific Actor
                          </FormLabel>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField  size="small"  placeholder="user12"value={actorInput[feature.name || ''] || ''} onChange={(e) =>  feature.name && setActorInput({...actorInput, [feature.name]: e.target.value}) } sx={{ flex: 1 }} variant="outlined" />
                            <Button variant="outlined" color="success"disabled={!feature.name} onClick={() => { if (feature.name && actorInput[feature.name]) { addActor(feature.name, actorInput[feature.name]);   setActorInput({...actorInput, [feature.name]: ''});} }}>
                              Add
                            </Button>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                            Actors: {feature.actors || 'None'}
                          </Typography>
                        </FormGroup>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              ))}

              {/* Create New Feature */}
              <Paper elevation={2} sx={{   p: 3,   border: '2px dashed',borderColor: 'secondary.main',background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'secondary.dark', fontWeight: 'bold' }}>
                  Create New Feature Flag
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <TextField  placeholder="new_feature_name" value={newFeatureName} onChange={(e) => setNewFeatureName(e.target.value)} sx={{ flex: 1 }} variant="outlined" size="small" />
                  <Button variant="contained" color="secondary"   onClick={() => { if (newFeatureName) { toggleFeature(newFeatureName, false);setNewFeatureName('');} }}disabled={!newFeatureName.trim()} >  Create </Button>
                </Box>
              </Paper>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    );
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{  minHeight: '100vh',  backgroundColor: features.dark_mode ? 'grey.900' : 'grey.50',transition: 'background-color 0.3s ease' }}>
      {/* Header */}
      <AppBar position="static" elevation={4} sx={{  background: features.dark_mode ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'  }}>
        <Toolbar sx={{ py: 1 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}> <FlashOn />  </Avatar>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}> Flipper POC </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <People sx={{ color: 'rgba(255,255,255,0.8)' }} />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>User ID:  </Typography>
            <TextField  size="small" value={userId}onChange={(e) => setUserId(e.target.value)}  onKeyPress={handleKeyPress} placeholder="Enter user ID" variant="outlined" sx={{ backgroundColor: 'rgba(255,255,255,0.9)',  borderRadius: 1, width: '150px' }} />
            <Button  variant="contained"color="secondary"   onClick={handleSearch}  disabled={loading} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Search />} sx={{  backgroundColor: 'rgba(255,255,255,0.2)', '&:hover': {backgroundColor: 'rgba(255,255,255,0.3)'} }}>  {loading ? 'Loading...' : 'Search'} </Button>
          </Box>
        </Toolbar>
        
        {currentUserId && (
          <Box sx={{ px: 3, pb: 2 }}><Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Currently viewing: <strong>{currentUserId}</strong></Typography> </Box>
        )}
      </AppBar>

      {/* Navigation Tabs */}
      <Paper elevation={2} sx={{ position: 'sticky', top: 0, zIndex: 10 }}>
        <Tabs  value={activeTab}   onChange={handleTabChange} centered  sx={{ '& .MuiTab-root': { textTransform: 'none', fontSize: '1rem',  fontWeight: 'medium'} }}>
          <Tab label="Dashboard" />
          <Tab label="Experiment" />
          <Tab label="Admin" />
        </Tabs>
      </Paper>
      {/* Main Content */}
      <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6" color="text.secondary"> Loading user data...</Typography>
            </Box>
          </Box>
        )}

        {!loading && (
          <>
            {activeTab === 0 && <DashboardTabContent />}
            {activeTab === 1 && <ExperimentTabContent />}
            {activeTab === 2 && <AdminTabContent />}
          </>
        )}
        {/* Feature Status Section */}
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                Current Feature Status for <Box component="span" sx={{ color: 'primary.main' }}>{currentUserId}</Box>
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {Object.entries(features).map(([featureName, enabled]: [string, boolean]) => (
                  <Paper  key={featureName} elevation={2}  sx={{ p: 2, minWidth: { xs: '100%', sm: '280px', md: '250px' }, flex: { sm: '1 1 280px' },display: 'flex',  justifyContent: 'space-between', alignItems: 'center', backgroundColor: enabled ? 'success.light' : 'error.light', borderLeft: '4px solid', borderColor: enabled ? 'success.main' : 'error.main', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }} >
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {featureName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                    <Chip label={enabled ? 'ON' : 'OFF'}  color={enabled ? 'success' : 'error'} size="small"sx={{ fontWeight: 'bold' }} />
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Info Section */}
          <Alert severity="info" sx={{ mt: 4 }}>
            <AlertTitle sx={{ fontWeight: 'bold' }}>How to test this Flipper POC:</AlertTitle>
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary=" Enter different User IDs (like user1, user2, admin, test123) and click Search"  sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem' } }} />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary="Use the Admin tab to toggle features, set percentage rollouts, or add specific users"  sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem' } }}  />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText  primary="Use Quick Actions to setup common scenarios like 'New Dashboard for 10 users'"  sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem' } }} />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText  primary=" Watch how features change based on user-specific settings in the Experiment tab"  sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem' } }} />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemText primary=" Check the browser console logs to see detailed feature evaluation process"  sx={{ '& .MuiListItemText-primary': { fontSize: '0.9rem' } }} />
              </ListItem>
            </List>
          </Alert>
        </Container>
      </Box>
    </Box>
  );
};

export default FlipperDemo;