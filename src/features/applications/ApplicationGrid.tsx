"use client";
import React, { useMemo, useState } from 'react';
import { useApplications } from './ApplicationContext';
import { Card, CardContent, Typography, CircularProgress, Box, IconButton, Tooltip, Fade, Stack } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import InventoryIcon from '@mui/icons-material/Inventory2';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CalculateIcon from '@mui/icons-material/Calculate';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AppsIcon from '@mui/icons-material/Apps';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// 3 x 3 grid enforced
const PAGE_SIZE = 9;

const iconForApp = (id: string, name: string) => {
  // Recognize wealth management explicitly
  if (/wealth|portfolio|asset/i.test(id + name)) return <AccountBalanceIcon fontSize="large" color="primary" />;
  if (/inventory/i.test(id) || /inventory/i.test(name)) return <InventoryIcon fontSize="large" color="primary" />;
  if (/tms|task/i.test(id+name)) return <WorkHistoryIcon fontSize="large" color="primary" />;
  if (/itdn|transport|delivery|ship/i.test(id+name)) return <LocalShippingIcon fontSize="large" color="primary" />;
  if (/tax/i.test(id+name)) return <CalculateIcon fontSize="large" color="primary" />;
  if (/finance|account|invoice|statement|ar|ap/i.test(id+name)) return <AccountBalanceIcon fontSize="large" color="primary" />;
  if (/admin/i.test(id+name)) return <AdminPanelSettingsIcon fontSize="large" color="primary" />;
  return <AppsIcon fontSize="large" color="primary" />;
};

const friendly = (name: string) => name;

export const ApplicationGrid: React.FC = () => {
  const { applications, loading } = useApplications();
  const pathname = usePathname();
  const [page, setPage] = useState(0);
  const theme = useTheme();
  // compact mode for <= md (900px) ensures consistent compact tiles on small and mid widths
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isCompact = useMediaQuery(theme.breakpoints.down('md')); // <= md => compact (hide description + CTA)
  const isMdUp = !isCompact;

  // Derive tenantId from path /tenant/{id}/...
  const segments = pathname.split('/').filter(Boolean);
  const tenantId = segments[0] === 'tenant' ? segments[1] : (typeof window !== 'undefined' ? localStorage.getItem('tenantId') || '' : '');

  const pages = useMemo(() => {
    if (!applications.length) return [] as typeof applications[];
    const arr: typeof applications[] = [];
    for (let i=0;i<applications.length;i+=PAGE_SIZE) {
      arr.push(applications.slice(i, i+PAGE_SIZE));
    }
    return arr;
  }, [applications]);

  const currentApps = pages.length ? pages[Math.min(page, pages.length-1)] : [];
  const totalPages = pages.length || 1; // at least 1 for placeholder rendering

  // Placeholder tiles to always fill 9
  const placeholders = Array.from({ length: Math.max(0, PAGE_SIZE - currentApps.length) });

  if (loading) return <Box display="flex" alignItems="center" gap={1}><CircularProgress size={22}/> <Typography variant="body2">Loading applications...</Typography></Box>;
  if (!tenantId) return <div>No tenant selected.</div>;

  const buildTarget = (host?: string | null, id?: string) => {
    if (host && host.startsWith('/')) {
      if (host.startsWith('/tenant/')) return host; // already scoped
      if (host.startsWith('/apps/')) {
        const cleaned = host.replace(/^\/apps\//, '/');
        return `/tenant/${tenantId}${cleaned}`;
      }
      return `/tenant/${tenantId}${host}`;
    }
    return `/tenant/${tenantId}/${id}`;
  };

  return (
    <Box maxWidth={1100} mx="auto" pt={isXs ? 1 : 2}>
      <Stack direction={isXs ? 'column' : 'row'} alignItems={isXs ? 'flex-start' : 'center'} justifyContent="space-between" mb={isXs ? 1.5 : 2} px={0.5} gap={isXs ? 1 : 0}>
        <Typography variant={isXs ? 'h6' : 'h5'} fontWeight={600} sx={{ letterSpacing: 0.25 }}>Applications</Typography>
        {totalPages > 1 && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Previous">
              <span>
                <IconButton size={isXs ? 'medium':'small'} disabled={page===0} onClick={()=> setPage(p=> Math.max(0,p-1))} aria-label="Previous page">
                  <ArrowBackIosNewIcon fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
            <Typography variant="caption" sx={{ minWidth: isXs ? 80 : 60, textAlign:'center' }}>Page {page+1} / {totalPages}</Typography>
            <Tooltip title="Next">
              <span>
                <IconButton size={isXs ? 'medium':'small'} disabled={page>=totalPages-1} onClick={()=> setPage(p=> Math.min(totalPages-1,p+1))} aria-label="Next page">
                  <ArrowForwardIosIcon fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        )}
      </Stack>

      <Box
        display="grid"
        // 2 columns on xs (<=600px) for better fit, 3 columns on sm+ (>=600px)
        sx={{
          gridTemplateColumns: { xs: 'repeat(2, minmax(0,1fr))', sm: 'repeat(3, minmax(0,1fr))' },
          // ensure rows share equal height so column alignment stays consistent
          gridAutoRows: '1fr',
          // let rows auto-flow; cards enforce square aspect via aspect-ratio
          gap: isCompact ? 1 : 2,
          width: '100%',
          overflowX: 'hidden',
          '& .app-tile': {
            minWidth: 0,
            boxSizing: 'border-box',
            width: '100%',
            height: '100%',
             position: 'relative',
             display: 'flex',
             flexDirection: 'column',
             // center content vertically in compact mode to avoid uneven visual alignment across columns
             justifyContent: isCompact ? 'center' : 'space-between',
             p: isCompact ? 0.75 : 2,
             aspectRatio: '1 / 1',
            overflow: 'hidden',
             background: isMdUp
               ? 'linear-gradient(135deg, var(--mui-palette-background-paper), var(--mui-palette-background-default))'
               : 'var(--mui-palette-background-paper)',
             transition: 'box-shadow .25s, transform .25s, background .25s',
             borderRadius: 3,
             border: '1px solid',
             borderColor: 'divider',
             textDecoration: 'none',
             WebkitTapHighlightColor: 'rgba(0,0,0,0)',
             '&:hover': {
               boxShadow: 6,
               transform: 'translateY(-4px)'
             },
             '&:active': {
               transform: 'translateY(-1px) scale(.985)'
             },
             '&:focus-visible': {
               outline: '2px solid var(--mui-palette-primary-main)',
               outlineOffset: 2
             }
          },
          '& .app-placeholder': {
            opacity: 0.3,
            background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)',
            borderStyle: 'dashed'
          }
        }}
      >
        {currentApps.map(app => {
          const target = buildTarget(app.host, app.application_id);
          const IconLabel = iconForApp(app.application_id, app.name);
          const ariaLabel = app.description ? `${app.name}. ${app.description}` : app.name;
           // Always show description under the app name.
           // In compact mode we clamp to 2 lines to preserve tile uniformity; on larger screens allow 3 lines.
           const showDescription = true;
           const showOpenCta = !isCompact; // show CTA only on large screens > md
           return (
            <Link key={app.application_id} href={target} style={{ textDecoration: 'none', display: 'block', height: '100%' }} aria-label={`Open ${ariaLabel}`} title={ariaLabel}>
              <Card variant="outlined" className="app-tile" tabIndex={0} sx={{ minWidth:0 }}>
                 <CardContent
                   sx={{
                     p:0,
                     display:'flex',
                     flexDirection:'column',
                     gap: isCompact ? 0.5 : 1,
                     flexGrow:1,
                     alignItems: isCompact ? 'center' : 'flex-start',
                     textAlign: isCompact ? 'center' : 'left'
                   }}
                 >
                  <Box
                    display="flex"
                    justifyContent={isCompact ? 'center' : 'space-between'}
                    alignItems="center"
                    mb={isCompact ? 0 : 0.5}
                    minHeight={isCompact ? 20 : 40}
                    width="100%"
                  >
                    <Box sx={{ '& svg': { fontSize: isCompact ? 22 : 36 } }}>{IconLabel}</Box>
                  </Box>
                  <Typography
                    variant={isCompact ? 'subtitle2' : 'subtitle1'}
                    fontWeight={600}
                    lineHeight={1.2}
                    sx={{
                      fontSize: isCompact ? '0.9rem' : '1rem',
                      width: '100%',
                      whiteSpace: 'normal',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      overflow: 'hidden'
                    }}
                  >
                    {friendly(app.name)}
                  </Typography>
                  {/* Description shown under name; clamp to 2 lines on compact, 3 on larger screens */}
                  {app.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mt:0.25,
                        display:'-webkit-box',
                        WebkitLineClamp: isCompact ? 2 : 3,
                        WebkitBoxOrient:'vertical',
                        overflow:'hidden',
                        fontSize: isCompact ? '0.78rem' : '0.82rem'
                      }}
                    >{app.description}</Typography>
                  )}
                   {/* only add spacer/CTA on large screens to keep compact tiles uniform */}
                   {!isCompact && <Box flexGrow={1} />}
                   {showOpenCta && (
                     <Fade in timeout={200}>
                       <Typography variant="caption" color="primary" fontWeight={500} sx={{ fontSize:'0.75rem' }}>Open →</Typography>
                     </Fade>
                   )}
                 </CardContent>
               </Card>
             </Link>
           );
         })}
        {placeholders.map((_,i)=>(
          <Card key={`ph-${i}`} className="app-tile app-placeholder" aria-hidden="true" sx={{ minWidth:0 }}>
             <CardContent sx={{ p:0, display:'flex', flexDirection:'column', height:'100%', justifyContent:'center', alignItems:'center', textAlign:'center' }}>
               <Typography variant="caption" color="text.secondary" sx={{ fontSize: isXs? '0.65rem':'0.7rem' }}>Reserved</Typography>
             </CardContent>
           </Card>
         ))}
      </Box>

      <Typography variant="caption" color="text.secondary" display="block" mt={isXs ? 1.5 : 2} textAlign="center" sx={{ fontSize: isXs? '0.65rem':'0.7rem' }}>
        {applications.length} application{applications.length===1?'':'s'} · Page {page+1} of {totalPages}
      </Typography>
    </Box>
  );
};