/*
 * JBoss, Home of Professional Open Source
 * Copyright 2012, Red Hat, Inc., and individual contributors
 * by the @authors tag. See the copyright.txt in the distribution for a
 * full listing of individual contributors.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 */
package org.jboss.forge.shell;

import javax.enterprise.event.Observes;
import javax.inject.Inject;

import org.jboss.forge.shell.events.PostStartup;

/**
 * Handles the -e --evaluate command line option and shuts down the shell.
 * 
 * @author <a href="mailto:lincolnbaxter@gmail.com">Lincoln Baxter, III</a>
 * 
 */
public class EvaluateListener
{
    @Inject
    private Shell shell;

    public void evaluate(@Observes PostStartup event)
    {
        String evaluate = System.getProperty(Bootstrap.PROP_EVALUATE);
        if (evaluate != null)
        {
            try
            {
                shell.execute(evaluate);
                System.exit(0);
            }
            catch (Exception e)
            {
                System.exit(1);
            }
        }
    }
}
