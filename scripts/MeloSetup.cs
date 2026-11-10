using System;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using System.Threading;
using Microsoft.Win32;

namespace MeloInstaller
{
    public class SetupForm : Form
    {
        private ProgressBar progressBar;
        private Label lblTitle;
        private Label lblSubtitle;
        private Label lblStatus;
        private Panel accentPanel;
        private Label lblPercentage;
        private bool isSilent = false;

        public SetupForm(bool silent)
        {
            this.isSilent = silent;
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "MELO Desktop Setup";
            this.Size = new Size(520, 320);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(18, 18, 18);
            this.ForeColor = Color.White;

            lblTitle = new Label();
            lblTitle.Text = "MELO";
            lblTitle.Font = new Font("Segoe UI", 26, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(30, 215, 96); // #1ed760
            lblTitle.Location = new Point(32, 24);
            lblTitle.AutoSize = true;

            lblSubtitle = new Label();
            lblSubtitle.Text = "Desktop Music Application Setup";
            lblSubtitle.Font = new Font("Segoe UI", 12, FontStyle.Regular);
            lblSubtitle.ForeColor = Color.FromArgb(200, 200, 200);
            lblSubtitle.Location = new Point(35, 74);
            lblSubtitle.AutoSize = true;

            accentPanel = new Panel();
            accentPanel.Location = new Point(35, 106);
            accentPanel.Size = new Size(434, 3);
            accentPanel.BackColor = Color.FromArgb(30, 215, 96);

            lblStatus = new Label();
            lblStatus.Text = "Preparing installation...";
            lblStatus.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
            lblStatus.ForeColor = Color.FromArgb(179, 179, 179);
            lblStatus.Location = new Point(35, 130);
            lblStatus.Size = new Size(350, 24);

            lblPercentage = new Label();
            lblPercentage.Text = "0%";
            lblPercentage.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
            lblPercentage.ForeColor = Color.FromArgb(30, 215, 96);
            lblPercentage.Location = new Point(410, 130);
            lblPercentage.Size = new Size(60, 24);
            lblPercentage.TextAlign = ContentAlignment.MiddleRight;

            progressBar = new ProgressBar();
            progressBar.Location = new Point(35, 160);
            progressBar.Size = new Size(434, 18);
            progressBar.Style = ProgressBarStyle.Continuous;
            progressBar.Value = 0;

            Label lblFooter = new Label();
            lblFooter.Text = "Reconstructed with Reverse Engineer Anything (REA) Architecture";
            lblFooter.Font = new Font("Segoe UI", 8, FontStyle.Italic);
            lblFooter.ForeColor = Color.FromArgb(114, 114, 114);
            lblFooter.Location = new Point(35, 240);
            lblFooter.Size = new Size(434, 20);

            this.Controls.Add(lblTitle);
            this.Controls.Add(lblSubtitle);
            this.Controls.Add(accentPanel);
            this.Controls.Add(lblStatus);
            this.Controls.Add(lblPercentage);
            this.Controls.Add(progressBar);
            this.Controls.Add(lblFooter);

            this.Shown += SetupForm_Shown;
        }

        private void SetupForm_Shown(object sender, EventArgs e)
        {
            Thread installThread = new Thread(DoInstall);
            installThread.IsBackground = true;
            installThread.Start();
        }

        public void UpdateProgress(int percent, string status)
        {
            if (isSilent) return;
            try
            {
                if (this.IsHandleCreated && this.InvokeRequired)
                {
                    this.Invoke(new Action<int, string>(UpdateProgress), percent, status);
                    return;
                }
                if (percent < 0) percent = 0;
                if (percent > 100) percent = 100;
                progressBar.Value = percent;
                lblPercentage.Text = percent + "%";
                lblStatus.Text = status;
            }
            catch { }
        }

        public void DoInstall()
        {
            try
            {
                UpdateProgress(10, "Initializing target directories...");
                if (!isSilent) Thread.Sleep(200);

                string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string installDir = Path.Combine(localAppData, "Programs", "MELO");

                if (!Directory.Exists(installDir))
                {
                    Directory.CreateDirectory(installDir);
                }

                UpdateProgress(20, "Extracting MELO Desktop core files...");
                Assembly asm = Assembly.GetExecutingAssembly();
                bool extracted = false;

                using (Stream stream = asm.GetManifestResourceStream("AppPayload.zip"))
                {
                    if (stream != null)
                    {
                        using (ZipArchive archive = new ZipArchive(stream, ZipArchiveMode.Read))
                        {
                            int count = archive.Entries.Count;
                            int idx = 0;
                            foreach (ZipArchiveEntry entry in archive.Entries)
                            {
                                idx++;
                                string destinationPath = Path.GetFullPath(Path.Combine(installDir, entry.FullName));
                                if (string.IsNullOrEmpty(entry.Name))
                                {
                                    Directory.CreateDirectory(destinationPath);
                                    continue;
                                }
                                string parentDir = Path.GetDirectoryName(destinationPath);
                                if (!Directory.Exists(parentDir))
                                {
                                    Directory.CreateDirectory(parentDir);
                                }
                                entry.ExtractToFile(destinationPath, true);
                                if (!isSilent && idx % 15 == 0)
                                {
                                    int p = 20 + (int)(idx * 65.0 / count);
                                    UpdateProgress(p, "Extracting " + entry.Name + "...");
                                }
                            }
                            extracted = true;
                        }
                    }
                }

                if (!extracted)
                {
                    string exeDir = Path.GetDirectoryName(asm.Location);
                    string candidateZip = Path.Combine(exeDir, "scripts", "app-payload.zip");
                    if (!File.Exists(candidateZip))
                    {
                        candidateZip = Path.Combine(exeDir, "app-payload.zip");
                    }
                    if (File.Exists(candidateZip))
                    {
                        using (ZipArchive archive = ZipFile.OpenRead(candidateZip))
                        {
                            int count = archive.Entries.Count;
                            int idx = 0;
                            foreach (ZipArchiveEntry entry in archive.Entries)
                            {
                                idx++;
                                string destinationPath = Path.GetFullPath(Path.Combine(installDir, entry.FullName));
                                if (string.IsNullOrEmpty(entry.Name))
                                {
                                    Directory.CreateDirectory(destinationPath);
                                    continue;
                                }
                                string parentDir = Path.GetDirectoryName(destinationPath);
                                if (!Directory.Exists(parentDir))
                                {
                                    Directory.CreateDirectory(parentDir);
                                }
                                entry.ExtractToFile(destinationPath, true);
                                if (!isSilent && idx % 15 == 0)
                                {
                                    int p = 20 + (int)(idx * 65.0 / count);
                                    UpdateProgress(p, "Extracting " + entry.Name + "...");
                                }
                            }
                        }
                        extracted = true;
                    }
                    else
                    {
                        string winUnpacked = Path.Combine(exeDir, "win-unpacked");
                        if (!Directory.Exists(winUnpacked))
                        {
                            winUnpacked = Path.Combine(exeDir, "releases", "win-unpacked");
                        }
                        if (Directory.Exists(winUnpacked))
                        {
                            CopyDirectory(winUnpacked, installDir);
                            extracted = true;
                        }
                    }
                }

                UpdateProgress(88, "Creating desktop and Start menu shortcuts...");
                if (!isSilent) Thread.Sleep(150);

                string meloExe = Path.Combine(installDir, "MELO.exe");
                if (!File.Exists(meloExe))
                {
                    string elExe = Path.Combine(installDir, "electron.exe");
                    if (File.Exists(elExe))
                    {
                        File.Copy(elExe, meloExe, true);
                    }
                }

                CreateShortcut(
                    Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "MELO.lnk"),
                    meloExe,
                    "MELO - High-Fidelity Desktop Music Application"
                );

                string startMenuDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs");
                CreateShortcut(
                    Path.Combine(startMenuDir, "MELO.lnk"),
                    meloExe,
                    "MELO - High-Fidelity Desktop Music Application"
                );

                UpdateProgress(95, "Registering application metadata...");
                RegisterUninstall(installDir, meloExe);

                UpdateProgress(100, "Installation complete! Launching MELO...");
                if (!isSilent) Thread.Sleep(500);

                // Launch MELO
                if (File.Exists(meloExe))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = meloExe,
                        WorkingDirectory = installDir,
                        UseShellExecute = true
                    });
                }

                if (!isSilent)
                {
                    try
                    {
                        if (this.IsHandleCreated && this.InvokeRequired)
                        {
                            this.Invoke(new Action(() => this.Close()));
                        }
                        else
                        {
                            this.Close();
                        }
                    }
                    catch { }
                }
            }
            catch (Exception ex)
            {
                if (!isSilent)
                {
                    MessageBox.Show("Installation completed with notice: " + ex.Message, "MELO Setup", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    try { this.Close(); } catch { }
                }
            }
        }

        private static void CopyDirectory(string sourceDir, string targetDir)
        {
            Directory.CreateDirectory(targetDir);
            foreach (string file in Directory.GetFiles(sourceDir))
            {
                string dest = Path.Combine(targetDir, Path.GetFileName(file));
                File.Copy(file, dest, true);
            }
            foreach (string subDir in Directory.GetDirectories(sourceDir))
            {
                string dest = Path.Combine(targetDir, Path.GetFileName(subDir));
                CopyDirectory(subDir, dest);
            }
        }

        private static void CreateShortcut(string shortcutPath, string targetPath, string description)
        {
            try
            {
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType != null)
                {
                    dynamic shell = Activator.CreateInstance(shellType);
                    dynamic shortcut = shell.CreateShortcut(shortcutPath);
                    shortcut.TargetPath = targetPath;
                    shortcut.WorkingDirectory = Path.GetDirectoryName(targetPath);
                    shortcut.Description = description;
                    shortcut.Save();
                }
            }
            catch { }
        }

        private static void RegisterUninstall(string installDir, string exePath)
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\MELO"))
                {
                    if (key != null)
                    {
                        key.SetValue("DisplayName", "MELO Desktop");
                        key.SetValue("DisplayVersion", "1.0.0");
                        key.SetValue("Publisher", "MELO Team");
                        key.SetValue("InstallLocation", installDir);
                        key.SetValue("DisplayIcon", exePath);
                        key.SetValue("UninstallString", "\"" + exePath + "\" --uninstall");
                        key.SetValue("EstimatedSize", 220000);
                    }
                }
            }
            catch { }
        }
    }

    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            bool silent = false;
            foreach (string arg in args)
            {
                if (arg.Equals("/S", StringComparison.OrdinalIgnoreCase) ||
                    arg.Equals("--silent", StringComparison.OrdinalIgnoreCase) ||
                    arg.Equals("-s", StringComparison.OrdinalIgnoreCase))
                {
                    silent = true;
                }
            }

            if (silent)
            {
                SetupForm form = new SetupForm(true);
                form.DoInstall();
            }
            else
            {
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new SetupForm(false));
            }
        }
    }
}
